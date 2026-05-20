import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { ConnektaMap, type ConnektaMapRef } from '@/components/map/ConnektaMap';
import { useAppTheme } from '@/context/ThemeContext';
import { friendsAPI, type FriendUser } from '@/services/api';
import { Font, Type } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';
import { useFriendLocationsPoll } from '@/hooks/useFriendLocationsPoll';
import { PlaceLabelMarker } from '@/components/map/PlaceLabelMarker';
import type { MapRegion } from '@/types/map';
import { capList, MAX_FRIEND_MARKERS_PREVIEW } from '@/utils/map-limits';

function apiErrorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'response' in e) {
    const data = (e as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  return fallback;
}

export default function FriendsTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { invite: inviteParam } = useLocalSearchParams<{ invite?: string }>();
  const { token, isLoggedIn } = useAuth();
  const { colors, accent } = useAppTheme();
  const mapRef = useRef<ConnektaMapRef>(null);

  const [focused, setFocused] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);

  const { locations: friendLocations, refresh: refreshLocations } = useFriendLocationsPoll(
    focused && isLoggedIn,
    token
  );

  const region: MapRegion | null = useMemo(() => {
    if (!me) return null;
    return {
      latitude: me.lat,
      longitude: me.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [me]);

  const friendMarkers = useMemo(
    () => capList(friendLocations, MAX_FRIEND_MARKERS_PREVIEW),
    [friendLocations]
  );

  const loadLists = useCallback(async () => {
    if (!token) return;
    try {
      const [f, inc] = await Promise.all([friendsAPI.list(), friendsAPI.incoming()]);
      if (f.success && Array.isArray(f.friends)) setFriends(f.friends);
      if (inc.success && Array.isArray(inc.incoming)) setIncoming(inc.incoming);
    } catch {
      /* network */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn || !token) return;
      setFocused(true);
      setLoading(true);
      void loadLists();

      let cancelled = false;
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (cancelled || status !== 'granted') return;
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!cancelled) setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        } catch {
          /* ignore */
        }
      })();

      return () => {
        cancelled = true;
        setFocused(false);
      };
    }, [isLoggedIn, token, loadLists])
  );

  useEffect(() => {
    if (typeof inviteParam === 'string' && inviteParam.trim()) {
      router.replace({
        pathname: '/(tabs)/settings/CircleManagement',
        params: { invite: inviteParam.trim().toUpperCase() },
      });
    }
  }, [inviteParam, router]);

  useEffect(() => {
    if (region) mapRef.current?.flyTo(region, 500);
  }, [region]);

  const accept = async (id: number) => {
    try {
      const res = await friendsAPI.accept(id);
      if (res.success) {
        setIncoming((prev) => prev.filter((u) => u.id !== id));
        void loadLists();
        void refreshLocations();
      } else {
        Alert.alert('Accept failed', res.message ?? 'No pending request');
        void loadLists();
      }
    } catch (e) {
      Alert.alert('Accept failed', apiErrorMessage(e, 'Could not accept request'));
    }
  };

  const reject = async (id: number) => {
    try {
      const res = await friendsAPI.reject(id);
      if (res.success) setIncoming((prev) => prev.filter((u) => u.id !== id));
    } catch {
      Alert.alert('Error', 'Could not decline request');
    }
  };

  const focusFriend = (username: string) => {
    const loc = friendLocations.find((f) => f.username === username);
    if (loc) {
      mapRef.current?.flyTo(
        { latitude: loc.lat, longitude: loc.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        400
      );
    }
  };

  const renderHeader = () => (
    <View style={{ gap: 14, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <Text style={[Type.hero, { color: colors.textPrimary }]}>My Circle</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/settings/CircleManagement')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.glassBorderMedium,
          }}
        >
          <Ionicons name="people" size={16} color={accent.electricBlue} />
          <Text style={[Type.caption, { color: accent.electricBlue, fontFamily: Font.semibold }]}>Manage</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.mapBox, { borderColor: colors.glassBorderMedium }]}>
        {!region ? (
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.surface }]}>
            <ActivityIndicator color={accent.electricBlue} />
            <Text style={[Type.caption, { color: colors.textMuted, marginTop: 8 }]}>Getting your location…</Text>
          </View>
        ) : (
          <ConnektaMap ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={region} showUserLocation>
            {friendMarkers.map((f) => (
              <PlaceLabelMarker
                key={`friend-${f.id}`}
                id={`friend-${f.id}`}
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
          </ConnektaMap>
        )}
      </View>

      <Text style={[Type.caption, { color: colors.textMuted, paddingHorizontal: 4 }]}>
        Centered on you. Friends appear when they have live sharing on.
      </Text>

      {incoming.length > 0 ? (
        <GlassCard borderRadius={22} intensity="heavy" glowAccent style={{ paddingVertical: 14 }}>
          <Text style={[Type.section, { color: colors.textPrimary, marginBottom: 10 }]}>Pending requests</Text>
          {incoming.map((u) => (
            <View key={u.id} style={[styles.reqRow, { borderColor: colors.divider }]}>
              <Text style={[Type.body, { color: colors.textPrimary, flex: 1, fontFamily: Font.medium }]}>
                {u.username}
              </Text>
              <TouchableOpacity onPress={() => accept(u.id)} style={[styles.chip, { backgroundColor: accent.electricBlue }]}>
                <Text style={{ color: '#fff', fontFamily: Font.semibold }}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => reject(u.id)}
                style={[styles.chip, { borderWidth: 1, borderColor: colors.glassBorderMedium }]}
              >
                <Text style={{ color: colors.textSecondary, fontFamily: Font.medium }}>Decline</Text>
              </TouchableOpacity>
            </View>
          ))}
        </GlassCard>
      ) : null}

      <Text style={[Type.section, { color: colors.textPrimary, paddingHorizontal: 4 }]}>
        Friends ({friends.length})
      </Text>
    </View>
  );

  if (!isLoggedIn || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={accent.electricBlue} />
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.bg }]}>
      <FlatList
        data={friends}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 120,
          gap: 10,
        }}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadLists();
              void refreshLocations();
            }}
            tintColor={accent.electricBlue}
          />
        }
        renderItem={({ item }) => {
          const isLive = friendLocations.some((f) => f.id === item.id);
          return (
            <TouchableOpacity onPress={() => focusFriend(item.username)} activeOpacity={0.85}>
              <GlassCard borderRadius={20} intensity="light" style={{ paddingVertical: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: isLive ? `${accent.coral}22` : `${accent.electricBlue}18`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="person" size={20} color={isLive ? accent.coral : accent.electricBlue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>
                      {item.username}
                    </Text>
                    <Text style={[Type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                      {isLive ? 'Sharing location' : 'Not sharing live location'}
                    </Text>
                  </View>
                  {isLive ? <View style={[styles.liveDot, { backgroundColor: accent.coral }]} /> : null}
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <GlassCard borderRadius={16} intensity="light" style={{ padding: 20, alignItems: 'center' }}>
            <Ionicons name="people-outline" size={36} color={colors.textMuted} />
            <Text style={[Type.body, { color: colors.textMuted, marginTop: 10, textAlign: 'center' }]}>
              No friends yet. Open Manage to invite or join a circle.
            </Text>
          </GlassCard>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapBox: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
