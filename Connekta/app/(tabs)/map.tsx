import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import MapView, { Circle, Marker, Region,} from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useLiveFriendLocations } from '@/hooks/useLiveFriendLocations';
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
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { colors, accent } = useAppTheme();
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [sharing, setSharing] = useState(false);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const lastPing = useRef(0);
  const lastSent = useRef<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<MapView>(null);

  const { locations, refresh } = useLiveFriendLocations(sharing, token);

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
        loadingEnabled
        mapType="standard"
        onMapReady={() => mapRef.current?.animateToRegion(region, 400)}
      >
        {sharing && me ? (
          <Circle
            center={{ latitude: me.lat, longitude: me.lng }}
            radius={90}
            strokeColor={accent.electricBlue}
            fillColor={`${accent.electricBlue}1F`}
          />
        ) : null}
        {locations.map((f) => (
          <Marker
            key={f.id}
            coordinate={{ latitude: f.lat, longitude: f.lng }}
            title={f.username}
            description="Friend (live)"
            pinColor={accent.coral}
          />
        ))}
      </MapView>

      <View
        pointerEvents="box-none"
        style={[styles.overlay, { paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 8 }]}
      >
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
      </View>
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
