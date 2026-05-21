import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Switch,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { ConnektaMap, type ConnektaMapRef } from '@/components/map/ConnektaMap';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { ENABLE_MAP_LOCATION_TRACKING } from '@/constants/features';
import { useLiveFriendLocations } from '@/hooks/useLiveFriendLocations';
import { useCirclePlaces } from '@/hooks/useCirclePlaces';
import { PlaceLabelMarker } from '@/components/map/PlaceLabelMarker';
import { PlaceAreaMarker } from '@/components/map/PlaceAreaMarker';
import { locationAPI } from '@/services/api';
import { Font, Type } from '@/constants/typography';
import type { MapRegion } from '@/types/map';
import {
  capList,
  MAX_FRIEND_MARKERS_MAIN,
  MAX_PLACE_MARKERS_MAIN,
} from '@/utils/map-limits';

const MIN_PING_MS = 20000;
const MIN_MOVE_M = 50;

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
  const { token, user, isLoggedIn } = useAuth();
  const { colors, accent } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [sharing, setSharing] = useState(false);
  const [showPlaces, setShowPlaces] = useState(true);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastPing = useRef(0);
  const lastSent = useRef<{ lat: number; lng: number } | null>(null);
  const sharingRef = useRef(false);
  const mapRef = useRef<ConnektaMapRef>(null);
  const overlayShift = useRef(new Animated.Value(0)).current;

  sharingRef.current = sharing;

  const { locations, refresh } = useLiveFriendLocations(focused && isLoggedIn, token);
  const { places: circlePlaces, refresh: refreshPlaces } = useCirclePlaces(focused && isLoggedIn, token);

  const region: MapRegion | null = useMemo(() => {
    if (!me) return null;
    return {
      latitude: me.lat,
      longitude: me.lng,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }, [me]);

  const friendMarkers = useMemo(
    () => capList(locations, MAX_FRIEND_MARKERS_MAIN),
    [locations]
  );

  const placeMarkers = useMemo(() => {
    if (!showPlaces) return [];
    return capList(circlePlaces, MAX_PLACE_MARKERS_MAIN);
  }, [circlePlaces, showPlaces]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn || !token) return;
      setFocused(true);
      let sub: Location.LocationSubscription | undefined;
      let cancelled = false;

      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (cancelled) return;
          setPermission(status === 'granted' ? 'granted' : 'denied');
          if (status !== 'granted') {
            setLoading(false);
            return;
          }

          try {
            const s = await locationAPI.myState();
            if (!cancelled && s.success) setSharing(!!s.sharing);
          } catch {
            /* offline */
          }

          const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (cancelled) return;
          setMe({ lat: first.coords.latitude, lng: first.coords.longitude });
          setLoading(false);

          if (!ENABLE_MAP_LOCATION_TRACKING) return;

          sub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 40,
              timeInterval: 15000,
            },
            (loc) => {
              if (cancelled) return;
              const next = { lat: loc.coords.latitude, lng: loc.coords.longitude };
              setMe(next);
              if (!sharingRef.current) return;
              const now = Date.now();
              if (now - lastPing.current < MIN_PING_MS) return;
              const prev = lastSent.current;
              if (prev && distanceM(prev, next) < MIN_MOVE_M) return;
              lastPing.current = now;
              lastSent.current = next;
              locationAPI.ping(next.lat, next.lng).catch(() => undefined);
            }
          );
        } catch {
          if (!cancelled) {
            setLoading(false);
            setPermission('denied');
          }
        }
      })();

      return () => {
        cancelled = true;
        setFocused(false);
        sub?.remove();
      };
    }, [isLoggedIn, token])
  );

  const onToggleShare = async (value: boolean) => {
    if (!token) return;
    setSharing(value);
    try {
      await locationAPI.setSharing(value);
      if (value && me) {
        lastPing.current = 0;
        lastSent.current = null;
        locationAPI.ping(me.lat, me.lng).catch(() => undefined);
        void refresh();
        void refreshPlaces();
      }
    } catch {
      setSharing(!value);
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={accent.electricBlue} />
      </View>
    );
  }

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
      <ConnektaMap
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        showUserLocation
        onPress={undefined}
      >
        {friendMarkers.map((f) => (
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
        {placeMarkers.map((p) => {
          const isMine = user?.id === p.user_id;
          return (
            <PlaceAreaMarker
              key={`place-${p.id}`}
              id={`place-${p.id}`}
              latitude={p.lat}
              longitude={p.lng}
              label={p.name}
              subtitle={isMine ? 'Your place' : p.username}
              accentColor={isMine ? accent.electricBlue : accent.teal}
            />
          );
        })}
      </ConnektaMap>

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
                {friendMarkers.length} friends · {showPlaces ? placeMarkers.length : 0} places shown
              </Text>
            </View>
            <Switch
              value={sharing}
              onValueChange={onToggleShare}
              trackColor={{ false: colors.divider, true: `${accent.electricBlue}88` }}
              thumbColor={sharing ? accent.electricBlue : colors.textTertiary}
            />
          </View>
          <View style={[styles.row, { marginTop: 10 }]}>
            <Text style={[Type.caption, { color: colors.textMuted, flex: 1 }]}>Show saved places</Text>
            <Switch
              value={showPlaces}
              onValueChange={setShowPlaces}
              trackColor={{ false: colors.divider, true: `${accent.teal}88` }}
              thumbColor={showPlaces ? accent.teal : colors.textTertiary}
            />
          </View>
        </GlassCard>
      </Animated.View>

      <Modal visible={menuOpen} animationType="fade" transparent onRequestClose={() => setMenuOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <TouchableOpacity onPress={() => setMenuOpen(false)} style={StyleSheet.absoluteFill} activeOpacity={1} />
          <GlassCard
            borderRadius={24}
            intensity="heavy"
            blur={false}
            style={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              paddingTop: 20,
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={[Type.section, { color: colors.textPrimary }]}>Menu</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                router.push('/(tabs)/MyPlaces');
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
                router.push('/(tabs)/ShareLocation');
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
                router.push('/(tabs)/SOSScreen');
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
