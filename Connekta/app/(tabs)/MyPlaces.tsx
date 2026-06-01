import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ConnektaMap, type ConnektaMapRef } from '@/components/map/ConnektaMap';
import type { MapRegion } from '@/types/map';
import { capList, MAX_PLACE_MARKERS_MAIN } from '@/utils/map-limits';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { PlaceAreaMarker } from '@/components/map/PlaceAreaMarker';
import { useAppTheme } from '@/context/ThemeContext';
import { Font, Type } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';
import { firestoreErrorMessage } from '@/services/firebase-auth';
import {
  createPlace,
  deletePlace,
  listMyPlaces,
} from '@/services/firestore-places';
import type { SavedPlace } from '@/types/places';

const DEFAULT_REGION: MapRegion = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MyPlacesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, accent } = useAppTheme();
  const { user } = useAuth();
  const mapRef = useRef<ConnektaMapRef>(null);

  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState<MapRegion>(DEFAULT_REGION);
  const [saving, setSaving] = useState(false);

  const loadPlaces = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      setPlaces(await listMyPlaces(user.uid));
    } catch {
      Alert.alert('Error', 'Could not load your places.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadPlaces();
  }, [loadPlaces]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const r: MapRegion = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
      setRegion(r);
      if (!pin) setPin({ lat: r.latitude, lng: r.longitude });
    })();
  }, []);

  const openAdd = () => {
    setPlaceName('');
    setPin((p) => p ?? { lat: region.latitude, lng: region.longitude });
    setAddOpen(true);
  };

  const savePlace = async () => {
    const name = placeName.trim();
    if (!user?.uid) {
      Alert.alert('Sign in required', 'Please sign in again to save places.');
      return;
    }
    if (!name) {
      Alert.alert('Name required', 'Give this place a name your circle will recognize.');
      return;
    }
    if (!pin) {
      Alert.alert('Pick a spot', 'Tap the map to set the location.');
      return;
    }
    setSaving(true);
    try {
      const place = await createPlace(
        user.uid,
        user.username,
        name,
        pin.lat,
        pin.lng,
      );
      setPlaces((prev) => [place, ...prev]);
      setAddOpen(false);
      Alert.alert('Saved', `"${name}" is visible to your circle on the map.`);
    } catch (err: unknown) {
      console.error('[MyPlaces] savePlace failed:', err);
      Alert.alert('Could not save place', firestoreErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(
    (place: SavedPlace) => {
      if (!user?.uid) return;
      Alert.alert('Delete place', `Remove "${place.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlace(place.id, user.uid);
              setPlaces((prev) => prev.filter((p) => p.id !== place.id));
            } catch {
              Alert.alert('Error', 'Could not delete place');
            }
          },
        },
      ]);
    },
    [user?.uid],
  );

  const focusPlace = (place: SavedPlace) => {
    mapRef.current?.flyTo(
      {
        latitude: place.lat,
        longitude: place.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      400
    );
  };

  const previewMarkers = useMemo(() => {
    const capped = capList(places, MAX_PLACE_MARKERS_MAIN);
    return capped.map((p) => (
      <PlaceAreaMarker
        key={`mine-${p.id}`}
        id={`mine-${p.id}`}
        latitude={p.lat}
        longitude={p.lng}
        label={p.name}
        subtitle="Your saved place"
        accentColor={accent.electricBlue}
      />
    ));
  }, [places, accent.electricBlue, colors]);

  const renderPlaceItem = ({ item }: { item: SavedPlace }) => (
    <TouchableOpacity onPress={() => focusPlace(item)} activeOpacity={0.85}>
      <GlassCard borderRadius={16} intensity="light" style={{ marginBottom: 12, paddingVertical: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: `${accent.electricBlue}22`,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="location" size={22} color={accent.electricBlue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>{item.name}</Text>
            <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>
              {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,67,54,0.12)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#FF4336" />
          </TouchableOpacity>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.mapWrap}>
        <ConnektaMap
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showUserLocation
          onPress={
            addOpen
              ? (coord) => setPin({ lat: coord.latitude, lng: coord.longitude })
              : undefined
          }
        >
          {previewMarkers}
          {addOpen && pin ? (
            <PlaceAreaMarker
              id="draft-place"
              latitude={pin.lat}
              longitude={pin.lng}
              label={placeName.trim() || 'New place'}
              accentColor={accent.coral}
            />
          ) : null}
        </ConnektaMap>

        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + 8, backgroundColor: colors.glassBgMedium, borderColor: colors.glassBorderMedium }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.sheet, { backgroundColor: colors.bg, paddingBottom: insets.bottom + 16 }]}>
        <Text style={[Type.section, { color: colors.textPrimary, marginBottom: 4 }]}>My Places</Text>
        <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 12 }]}>
          Saved spots appear on the live map for everyone in your circle.
        </Text>

        {loading ? (
          <ActivityIndicator color={accent.electricBlue} style={{ marginVertical: 16 }} />
        ) : places.length === 0 ? (
          <Text style={[Type.body, { color: colors.textMuted, marginBottom: 12 }]}>No places yet — add one below.</Text>
        ) : (
          <FlatList
            data={places}
            renderItem={renderPlaceItem}
            keyExtractor={(item) => String(item.id)}
            style={{ maxHeight: 200 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        <GlassButton title="Add place on map" onPress={openAdd} variant="primary" fullWidth style={{ marginTop: 8 }} />
      </View>

      <Modal visible={addOpen} animationType="slide" transparent onRequestClose={() => setAddOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setAddOpen(false)} activeOpacity={1} />
          <GlassCard
            borderRadius={24}
            intensity="heavy"
            style={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              padding: 20,
              paddingBottom: insets.bottom + 20,
            }}
          >
            <Text style={[Type.section, { color: colors.textPrimary, marginBottom: 8 }]}>New place</Text>
            <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 12 }]}>
              Tap the map above to move the pin, then name this spot.
            </Text>
            <TextInput
              placeholder="e.g. Home, Office, Gym"
              placeholderTextColor={colors.inputPlaceholder}
              value={placeName}
              onChangeText={setPlaceName}
              style={[
                styles.nameInput,
                {
                  color: colors.textPrimary,
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBg,
                  fontFamily: Font.regular,
                },
              ]}
            />
            {pin ? (
              <Text style={[Type.caption, { color: colors.textMuted, marginTop: 8 }]}>
                Pin: {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <GlassButton title="Cancel" onPress={() => setAddOpen(false)} variant="secondary" style={{ flex: 1 }} />
              <GlassButton
                title={saving ? 'Saving…' : 'Save place'}
                onPress={savePlace}
                variant="primary"
                style={{ flex: 1 }}
                disabled={saving}
              />
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: { height: '42%' },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -12,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
