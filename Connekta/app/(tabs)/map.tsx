import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { ConnektaMap, type ConnektaMapRef } from '@/components/map/ConnektaMap';
import { MapTabChrome, type MapFilterChip } from '@/components/map/MapTabChrome';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { ENABLE_MAP_LOCATION_TRACKING } from '@/constants/features';
import { MAP_ZOOM } from '@/utils/maps-config';
import { useLiveFriendLocations } from '@/hooks/useLiveFriendLocations';
import { useCirclePlaces } from '@/hooks/useCirclePlaces';
import { PlaceLabelMarker } from '@/components/map/PlaceLabelMarker';
import { PlaceAreaMarker } from '@/components/map/PlaceAreaMarker';
import { resolvePlaceKind } from '@/utils/place-kind';
import { locationAPI } from '@/services/api';
import { Font, Type } from '@/constants/typography';
import type { MapRegion } from '@/types/map';
import {
  capList,
  MAX_FRIEND_MARKERS_MAIN,
  MAX_PLACE_MARKERS_MAIN,
} from '@/utils/map-limits';
import {
  canSendLocationPing,
  markLocationPingSent,
  MIN_LOCATION_PING_MS,
} from '@/utils/location-ping-coalesce';

const MIN_PING_MS = MIN_LOCATION_PING_MS;
/** Min movement before another ping (meters). */
const MIN_MOVE_M = 15;

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
  const { user, isLoggedIn } = useAuth();
  const uid = user?.uid ?? null;
  const { colors, accent } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [sharing, setSharing] = useState(false);
  const [showPlaces, setShowPlaces] = useState(true);
  const [filter, setFilter] = useState<MapFilterChip>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastSent = useRef<{ lat: number; lng: number } | null>(null);
  const sharingRef = useRef(false);
  const mapRef = useRef<ConnektaMapRef>(null);

  sharingRef.current = sharing;

  const { locations, refresh } = useLiveFriendLocations(focused && isLoggedIn, uid);
  const { places: circlePlaces, refresh: refreshPlaces } = useCirclePlaces(focused && isLoggedIn, uid);

  const region: MapRegion | null = useMemo(() => {
    if (!me) return null;
    return {
      latitude: me.lat,
      longitude: me.lng,
      latitudeDelta: MAP_ZOOM.defaultLatitudeDelta,
      longitudeDelta: MAP_ZOOM.defaultLatitudeDelta,
    };
  }, [me]);

  const q = searchQuery.trim().toLowerCase();

  const friendMarkers = useMemo(() => {
    let list = capList(locations, MAX_FRIEND_MARKERS_MAIN);
    if (q) list = list.filter((f) => f.username.toLowerCase().includes(q));
    return list;
  }, [locations, q]);

  const placeMarkers = useMemo(() => {
    if (!showPlaces || filter === 'friends') return [];
    const valid = circlePlaces.filter(
      (p) =>
        Number.isFinite(p.lat) &&
        Number.isFinite(p.lng) &&
        p.lat >= -90 &&
        p.lat <= 90 &&
        p.lng >= -180 &&
        p.lng <= 180 &&
        p.name?.trim() &&
        (!q || p.name.trim().toLowerCase().includes(q))
    );
    return capList(valid, MAX_PLACE_MARKERS_MAIN);
  }, [circlePlaces, showPlaces, filter, q]);

  const showFriendMarkers = filter !== 'places';
  const showPlaceMarkers = filter !== 'friends' && showPlaces;

  const feedLocations = useMemo(() => {
    if (!q) return friendMarkers;
    return friendMarkers;
  }, [friendMarkers, q]);

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn && uid) void refreshPlaces();
    }, [isLoggedIn, uid, refreshPlaces])
  );

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn || !uid) return;
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

          const maybePing = (next: { lat: number; lng: number }, force = false) => {
            if (!sharingRef.current) return;
            if (!force && !canSendLocationPing()) return;
            const prev = lastSent.current;
            if (!force && prev && distanceM(prev, next) < MIN_MOVE_M) return;
            lastSent.current = next;
            markLocationPingSent();
            locationAPI.ping(next.lat, next.lng).catch(() => undefined);
          };

          sub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: MIN_MOVE_M,
              timeInterval: MIN_PING_MS,
            },
            (loc) => {
              if (cancelled) return;
              const next = { lat: loc.coords.latitude, lng: loc.coords.longitude };
              setMe(next);
              maybePing(next);
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
    }, [isLoggedIn, uid])
  );

  const onToggleShare = async (value: boolean) => {
    if (!uid) return;
    setSharing(value);
    sharingRef.current = value;
    try {
      await locationAPI.setSharing(value);
      if (value) {
        let pos = me;
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === 'granted') {
            const fresh = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            pos = { lat: fresh.coords.latitude, lng: fresh.coords.longitude };
            setMe(pos);
          }
        } catch {
          /* use last known me */
        }
        if (pos) {
          lastSent.current = pos;
          markLocationPingSent();
          await locationAPI.ping(pos.lat, pos.lng);
        }
        void refresh();
        void refreshPlaces();
      } else {
        lastSent.current = null;
      }
    } catch {
      setSharing(!value);
      sharingRef.current = !value;
    }
  };

  const onRecenter = () => {
    if (region) mapRef.current?.flyTo(region, 500);
  };

  const onFilterChange = (chip: MapFilterChip) => {
    setFilter(chip);
    if (chip === 'places') setShowPlaces(true);
  };

  if (!isLoggedIn) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={accent.cyan} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={accent.cyan} />
        <Text style={[Type.body, { color: colors.textMuted, marginTop: 12, fontFamily: Font.regular }]}>
          Loading map…
        </Text>
      </View>
    );
  }

  if (permission !== 'granted' || !region) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg, padding: 24 }]}>
        <GlassCard borderRadius={16} glowAccent>
          <Text style={[Type.section, { color: colors.textPrimary, marginBottom: 8 }]}>Location needed</Text>
          <Text style={[Type.body, { color: colors.textMuted }]}>
            Enable location in system settings to see the live map and optional sharing.
          </Text>
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.mapBg }]}>
      {focused ? (
        <ConnektaMap
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showUserLocation
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {showFriendMarkers &&
            friendMarkers.map((f) => (
              <PlaceLabelMarker
                key={`live-${f.id}`}
                id={`live-${f.id}`}
                latitude={f.lat}
                longitude={f.lng}
                label={f.username}
                subtitle="Live"
                accentColor={accent.cyan}
                backgroundColor={colors.glassBgHeavy}
                textColor={colors.textPrimary}
                borderColor={accent.cyan}
              />
            ))}
          {showPlaceMarkers &&
            placeMarkers.map((p) => {
              const isMine = user?.uid != null && p.userId === user.uid;
              const kind = resolvePlaceKind(p);
              return (
                <PlaceAreaMarker
                  key={`place-${p.id}`}
                  id={`place-${p.id}`}
                  latitude={p.lat}
                  longitude={p.lng}
                  label={p.name.trim()}
                  placeKind={kind}
                  subtitle={isMine ? 'Your saved place' : p.username}
                  accentColor={isMine ? accent.cyan : accent.green}
                />
              );
            })}
        </ConnektaMap>
      ) : null}

      <MapTabChrome
        colors={colors}
        accent={accent}
        username={user?.username ?? 'You'}
        sharing={sharing}
        onToggleShare={onToggleShare}
        locations={feedLocations}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen((v) => !v)}
        filter={filter}
        onFilterChange={onFilterChange}
        onOpenMenu={() => setMenuOpen(true)}
        onSOS={() => router.push('/(tabs)/SOSScreen')}
        onAddPlace={() => router.push('/(tabs)/MyPlaces')}
        onRecenter={onRecenter}
      />

      <Modal visible={menuOpen} animationType="fade" transparent onRequestClose={() => setMenuOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <TouchableOpacity onPress={() => setMenuOpen(false)} style={StyleSheet.absoluteFill} activeOpacity={1} />
          <GlassCard
            borderRadius={24}
            intensity="heavy"
            blur={false}
            glowAccent
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
                setShowPlaces((v) => !v);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                borderBottomColor: colors.divider,
                borderBottomWidth: 1,
              }}
            >
              <Ionicons name="layers-outline" size={24} color={accent.cyan} />
              <View>
                <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>
                  {showPlaces ? 'Hide saved places' : 'Show saved places'}
                </Text>
                <Text style={[Type.caption, { color: colors.textMuted }]}>Toggle place markers on the map</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                router.push('/(tabs)/MyPlaces');
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                borderBottomColor: colors.divider,
                borderBottomWidth: 1,
              }}
            >
              <Ionicons name="location" size={24} color={accent.cyan} />
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
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                borderBottomColor: colors.divider,
                borderBottomWidth: 1,
              }}
            >
              <Ionicons name="share-social" size={24} color={accent.cyan} />
              <View>
                <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>Share Location</Text>
                <Text style={[Type.caption, { color: colors.textMuted }]}>Quick share your location</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                router.push('/(tabs)/settings');
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}
            >
              <Ionicons name="person-circle-outline" size={24} color={accent.cyan} />
              <View>
                <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>Profile</Text>
                <Text style={[Type.caption, { color: colors.textMuted }]}>Account and settings</Text>
              </View>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
