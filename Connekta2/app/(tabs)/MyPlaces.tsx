import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ConnektaMap, type ConnektaMapRef } from '@/components/map/ConnektaMap';
import type { MapRegion } from '@/types/map';
import { capList, MAX_PLACE_MARKERS_MAIN } from '@/utils/map-limits';
import * as Location from 'expo-location';
import { useRouter, useFocusEffect } from 'expo-router';
import { Host } from '@expo/ui';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { PlaceAreaMarker } from '@/components/map/PlaceAreaMarker';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeTypography } from '@/components/ui/NativeTypography';
import { Font } from '@/constants/typography';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { firestoreErrorMessage } from '@/connekta-firebase';
import {
  createPlace,
  deletePlace,
  listMyPlaces,
} from '@/connekta-firebase/firestore/places';
import type { PlaceKind, SavedPlace } from '@/types/places';
import { PlaceKindPicker } from '@/components/places/PlaceKindPicker';
import {
  PLACE_KIND_META,
  inferPlaceKindFromName,
  resolvePlaceKind,
} from '@/utils/place-kind';

const DEFAULT_REGION: MapRegion = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MyPlacesScreen() {
  const router = useRouter();
  const { colors, accent } = useAppTheme();
  const { user } = useAuth();
  const mapRef = useRef<ConnektaMapRef>(null);

  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [placeKind, setPlaceKind] = useState<PlaceKind>('home');
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState<MapRegion>(DEFAULT_REGION);
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

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
    setPlaceKind('home');
    setPin((p) => p ?? { lat: region.latitude, lng: region.longitude });
    setAddOpen(true);
  };

  const onPlaceKindChange = (kind: PlaceKind) => {
    setPlaceKind(kind);
    if (!placeName.trim() && kind !== 'other') {
      setPlaceName(PLACE_KIND_META[kind].label);
    }
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
      const kind =
        placeKind !== 'other' ? placeKind : inferPlaceKindFromName(name);
      const place = await createPlace(
        user.uid,
        user.username,
        name,
        pin.lat,
        pin.lng,
        kind,
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
    return capped.map((p) => {
      const kind = resolvePlaceKind(p);
      return (
        <PlaceAreaMarker
          key={`mine-${p.id}`}
          id={`mine-${p.id}`}
          latitude={p.lat}
          longitude={p.lng}
          label={p.name}
          placeKind={kind}
          subtitle="Your saved place"
          accentColor={accent.cyan}
        />
      );
    });
  }, [places, accent.cyan]);

  const draftKind = useMemo(
    () => (placeKind !== 'other' ? placeKind : inferPlaceKindFromName(placeName)),
    [placeKind, placeName]
  );

  const pinCoordsText = pin ? `Pin: ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : '';

  const renderPlaceItem = ({ item }: { item: SavedPlace }) => {
    const kind = resolvePlaceKind(item);
    const meta = PLACE_KIND_META[kind];
    const detailText = `${meta.label} · ${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`;
    return (
      <Pressable onPress={() => focusPlace(item)}>
        <GlassCard borderRadius={16} intensity="light" style={{ marginBottom: 12, paddingVertical: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: `${accent.cyan}22`,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Ionicons name={meta.icon} size={22} color={accent.cyan} />
            </View>
            <View style={{ flex: 1 }}>
              <NativeTypography
                variant="body"
                color={colors.textPrimary}
                textStyle={{ fontFamily: Font.semibold }}>
                {item.name}
              </NativeTypography>
              <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginTop: 4 }}>
                {detailText}
              </NativeTypography>
            </View>
            <GlassIconButton name="trash-outline" onPress={() => handleDelete(item)} danger size={20} />
          </View>
        </GlassCard>
      </Pressable>
    );
  };

  return (
    <NativeScreen contentStyle={{ paddingHorizontal: 0 }}>
      <View style={[styles.mapWrap, { backgroundColor: colors.mapBg }]}>
        {focused ? (
          <ConnektaMap
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            showUserLocation
            rotateEnabled={false}
            pitchEnabled={false}
            onPress={
              addOpen
                ? (coord) => setPin({ lat: coord.latitude, lng: coord.longitude })
                : undefined
            }>
            {previewMarkers}
            {addOpen && pin ? (
              <PlaceAreaMarker
                id="draft-place"
                latitude={pin.lat}
                longitude={pin.lng}
                label={placeName.trim() || 'New place'}
                placeKind={draftKind}
                subtitle="Tap map to move pin"
                accentColor={accent.cyan}
              />
            ) : null}
          </ConnektaMap>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.mapPlaceholder]}>
            <ActivityIndicator color={accent.cyan} />
          </View>
        )}

        <View style={styles.backBtnWrap}>
          <GlassIconButton name="chevron-back" onPress={() => router.back()} size={24} />
        </View>
      </View>

      <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
        <NativeTypography variant="section" color={colors.textPrimary} textStyle={{ marginBottom: 4 }}>
          My Places
        </NativeTypography>
        <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginBottom: 12 }}>
          Saved spots appear on the live map for everyone in your circle.
        </NativeTypography>

        {loading ? (
          <ActivityIndicator color={accent.electricBlue} style={{ marginVertical: 16 }} />
        ) : places.length === 0 ? (
          <NativeTypography variant="body" color={colors.textMuted} textStyle={{ marginBottom: 12 }}>
            No places yet — add one below.
          </NativeTypography>
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
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddOpen(false)} />
          <Host matchContents>
            <GlassCard
              borderRadius={24}
              intensity="heavy"
              style={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                padding: 20,
              }}>
              <NativeTypography variant="section" color={colors.textPrimary} textStyle={{ marginBottom: 8 }}>
                New place
              </NativeTypography>
              <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginBottom: 12 }}>
                Pick Home or Office (or another type), then name the spot and move the pin on the map.
              </NativeTypography>
              <PlaceKindPicker
                value={placeKind}
                onChange={onPlaceKindChange}
                accentColor={accent.cyan}
                textColor={colors.textPrimary}
                mutedColor={colors.textMuted}
                borderColor={colors.glassBorderMedium}
                chipBg={colors.inputBg}
              />
              <GlassInput
                layout="stacked"
                placeholder="e.g. Home, Office, Gym"
                value={placeName}
                onChangeText={setPlaceName}
              />
              {pin ? (
                <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginTop: 8 }}>
                  {pinCoordsText}
                </NativeTypography>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <GlassButton title="Cancel" onPress={() => setAddOpen(false)} variant="tonal" style={{ flex: 1 }} />
                <GlassButton
                  title={saving ? 'Saving…' : 'Save place'}
                  onPress={savePlace}
                  variant="primary"
                  style={{ flex: 1 }}
                  disabled={saving}
                />
              </View>
            </GlassCard>
          </Host>
        </KeyboardAvoidingView>
      </Modal>
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  mapWrap: { height: '42%', position: 'relative' },
  mapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnWrap: {
    position: 'absolute',
    left: 16,
    top: 8,
  },
  sheet: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -12,
    paddingBottom: 16,
  },
});
