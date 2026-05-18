import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Platform,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import MapView, { Circle, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useLiveFriendLocations } from '@/hooks/useLiveFriendLocations';
import { useCirclePlaces } from '@/hooks/useCirclePlaces';
import { PlaceLabelMarker } from '@/components/map/PlaceLabelMarker';
import { locationAPI } from '@/services/api';
import { Font, Type } from '@/constants/typography';

const MIN_PING_MS = 14000;
const MIN_MOVE_M = 45;

function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function MapTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { colors, accent } = useAppTheme();
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [sharing, setSharing] = useState(false);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastPing = useRef(0);
  const lastSent = useRef<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<MapView>(null);
  const overlayShift = useRef(new Animated.Value(0)).current;

  const { locations, refresh } = useLiveFriendLocations(sharing, token);
  const { places: circlePlaces, refresh: refreshPlaces } = useCirclePlaces(token);

  useFocusEffect(
    useCallback(() => {
      void refreshPlaces();
    }, [refreshPlaces])
  );

  /** Android AirMap throws when mapType updates to an invalid native value — omit on Android. */
  const mapTypeProps = Platform.OS === 'ios' ? { mapType: 'standard' as const } : {};

  const region: Region | null = useMemo(() => {
    if (!me) return null;
    return {
      latitude: me.lat,
      longitude: me.lng,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }, [me]);

  const syncSharing = useCallback(async () => {
    try {
      const s = await locationAPI.myState();
      if (s.success) setSharing(s.sharing);
    } catch {
      /* offline — keep local */
    }
  }, []);

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermission(status === 'granted' ? 'granted' : 'denied');
        if (status !== 'granted') {
          setLoading(false);
          return;
        }

        await syncSharing();

        const first = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = { lat: first.coords.latitude, lng: first.coords.longitude };
        setMe(coords);
        setLoading(false);

        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 35,
            timeInterval: 12000,
          },
          async (loc) => {
            const next = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            setMe(next);
            const now = Date.now();
            if (!sharing) return;
            if (now - lastPing.current < MIN_PING_MS) return;
            const prev = lastSent.current;
            if (prev && distanceM(prev, next) < MIN_MOVE_M) return;
            lastPing.current = now;
            lastSent.current = next;
            try {
              await locationAPI.ping(next.lat, next.lng);
              void refresh();
              void refreshPlaces();
            } catch {
              /* ignore transient errors */
            }
          }
        );
      } catch {
        setLoading(false);
        setPermission('denied');
      }
    })();

    return () => {
      sub?.remove();
    };
  }, [sharing, refresh, syncSharing]);

  const onToggleShare = async (value: boolean) => {
    setSharing(value);
    try {
      await locationAPI.setSharing(value);
      if (value && me) {
        lastPing.current = 0;
        lastSent.current = null;
        await locationAPI.ping(me.lat, me.lng);
        void refresh();
        void refreshPlaces();
      }
    } catch {
      setSharing(!value);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={accent.electricBlue} />
        <Text style={[Type.body, { color: colors.textMuted, marginTop: 12, fontFamily: Font.regular }]}>
          Loading map…
        </Text>
      </View>
    );
  }

  if (permission !== 'granted' || !region) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg, padding: 24 }]}>
        <GlassCard borderRadius={22}>
          <Text style={[Type.section, { color: colors.textPrimary, marginBottom: 8 }]}>Location needed</Text>
          <Text style={[Type.body, { color: colors.textMuted }]}>
            Enable location in system settings to see the live map and optional sharing.
          </Text>
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={Platform.OS === 'android'}
        showsCompass
        loadingEnabled={Platform.OS === 'ios'}
        {...mapTypeProps}
        onMapReady={() => mapRef.current?.animateToRegion(region, 400)}
        onRegionChange={() => {
          Animated.spring(overlayShift, {
            toValue: 6,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }}
        onRegionChangeComplete={() => {
          Animated.spring(overlayShift, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }}
      >
        {sharing && me ? (
          <Circle
            center={{ latitude: me.lat, longitude: me.lng }}
            radius={90}
            strokeColor="rgba(30, 144, 255, 0.55)"
            fillColor="rgba(30, 144, 255, 0.12)"
          />
        ) : null}
        {locations.map((f) => (
          <PlaceLabelMarker
            key={`live-${f.id}`}
            id={`live-${f.id}`}
            latitude={f.lat}
            longitude={f.lng}
            label={f.username}
            subtitle="Live"
            accentColor={accent.coral}
            backgroundColor={colors.glassBgHeavy}
            textColor={colors.textPrimary}
            borderColor={accent.coral}
          />
        ))}
        {circlePlaces.map((p) => {
          const isMine = user?.id === p.user_id;
          return (
            <PlaceLabelMarker
              key={`place-${p.id}`}
              id={`place-${p.id}`}
              latitude={p.lat}
              longitude={p.lng}
              label={p.name}
              subtitle={isMine ? 'Your place' : p.username}
              accentColor={isMine ? accent.electricBlue : accent.teal}
              backgroundColor={colors.glassBgMedium}
              textColor={colors.textPrimary}
              borderColor={isMine ? accent.electricBlue : colors.glassBorderMedium}
            />
          );
        })}
      </MapView>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 8,
            transform: [{ translateY: overlayShift }],
          },
        ]}
      >
        {/* Hamburger Menu Button */}
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          activeOpacity={0.85}
          style={{
            width: 48,
            height: 48,
            borderRadius: 22,
            backgroundColor: colors.glassBgMedium,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 14,
            borderWidth: 1,
            borderColor: colors.glassBorderMedium,
            shadowColor: colors.glassShadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.28,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Ionicons name="menu-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>

        <GlassCard intensity="medium" borderRadius={22} style={{ paddingVertical: 16 }}>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[Type.section, { color: colors.textPrimary }]}>Live map</Text>
              <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>
                Sharing is opt-in. Only accepted friends see you when sharing is on.
              </Text>
            </View>
            <Switch
              value={sharing}
              onValueChange={onToggleShare}
              trackColor={{ false: colors.divider, true: `${accent.electricBlue}88` }}
              thumbColor={sharing ? accent.electricBlue : colors.textTertiary}
            />
          </View>
        </GlassCard>
      </Animated.View>

      {/* Menu Modal */}
      <Modal
        visible={menuOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <TouchableOpacity
            onPress={() => setMenuOpen(false)}
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
          />
          <GlassCard
            borderRadius={24}
            intensity="heavy"
            blur
            style={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              paddingTop: 20,
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 20,
            }}
          >
            {/* Menu Title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={[Type.section, { color: colors.textPrimary }]}>Menu</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                // MyPlaces is at the same level, but we can navigate via router
                router.push('/(tabs)/MyPlaces' as any);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomColor: colors.divider, borderBottomWidth: 1 }}
            >
              <Ionicons name="location" size={24} color={accent.electricBlue} />
              <View>
                <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>My Places</Text>
                <Text style={[Type.caption, { color: colors.textMuted }]}>Save favorite locations</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                router.push('/(tabs)/ShareLocation' as any);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomColor: colors.divider, borderBottomWidth: 1 }}
            >
              <Ionicons name="share-social" size={24} color={accent.teal} />
              <View>
                <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>Share Location</Text>
                <Text style={[Type.caption, { color: colors.textMuted }]}>Quick share your location</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                router.push('/(tabs)/SOSScreen' as any);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}
            >
              <Ionicons name="alert-circle" size={24} color={accent.coral} />
              <View>
                <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>Emergency SOS</Text>
                <Text style={[Type.caption, { color: colors.textMuted }]}>Send emergency alert</Text>
              </View>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
});
