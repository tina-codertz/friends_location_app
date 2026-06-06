import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ConnektaMap, type ConnektaMapRef } from '@/components/map/ConnektaMap';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeTypography } from '@/components/ui/NativeTypography';
import { useAppTheme } from '@/context/ThemeContext';
import { friendsAPI, getApiErrorMessage, type FriendUser } from '@/services/api';
import { Font } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';
import { useFriendLocations } from '@/hooks/useFriendLocations';
import { PlaceLabelMarker } from '@/components/map/PlaceLabelMarker';
import type { MapRegion } from '@/types/map';
import { capList, MAX_FRIEND_MARKERS_PREVIEW } from '@/utils/map-limits';

export default function FriendsTabScreen() {
  const router = useRouter();
  const { invite: inviteParam } = useLocalSearchParams<{ invite?: string }>();
  const { user, isLoggedIn } = useAuth();
  const uid = user?.uid ?? null;
  const { colors, accent } = useAppTheme();
  const mapRef = useRef<ConnektaMapRef>(null);

  const [focused, setFocused] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);

  const { locations: friendLocations, refresh: refreshLocations } = useFriendLocations(
    focused && isLoggedIn,
    uid,
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
    if (!uid) return;
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
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn || !uid) return;
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
    }, [isLoggedIn, uid, loadLists])
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

  const accept = async (id: string) => {
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
      Alert.alert('Accept failed', getApiErrorMessage(e, 'Could not accept request'));
    }
  };

  const reject = async (id: string) => {
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
        <NativeTypography variant="hero" color={colors.textPrimary}>
          My Circle
        </NativeTypography>
        <GlassButton
          title="Manage"
          onPress={() => router.push('/(tabs)/settings/CircleManagement')}
          variant="glass"
          size="small"
          icon={<Ionicons name="people" size={16} color={accent.cyan} />}
        />
      </View>

      <View style={[styles.mapBox, { borderColor: colors.glassBorderMedium }]}>
        <View style={styles.mapClip}>
        {!region ? (
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.surface }]}>
            <ActivityIndicator color={accent.electricBlue} />
            <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginTop: 8 }}>
              Getting your location…
            </NativeTypography>
          </View>
        ) : focused ? (
          <ConnektaMap
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            showUserLocation
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {friendMarkers.map((f) => (
              <PlaceLabelMarker
                key={`friend-${f.id}`}
                id={`friend-${f.id}`}
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
          </ConnektaMap>
        ) : (
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.surface }]}>
            <Ionicons name="map-outline" size={32} color={colors.textMuted} />
          </View>
        )}
        </View>
      </View>

      <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ paddingHorizontal: 4 }}>
        Centered on you. Friends appear when they have live sharing on.
      </NativeTypography>

      {incoming.length > 0 ? (
        <GlassCard borderRadius={16} intensity="heavy" glowAccent padding={14}>
          <NativeTypography variant="section" color={colors.textPrimary} textStyle={{ marginBottom: 10 }}>
            Pending requests
          </NativeTypography>
          {incoming.map((u) => (
            <View key={u.id} style={[styles.reqRow, { borderColor: colors.divider }]}>
              <NativeTypography
                variant="body"
                color={colors.textPrimary}
                textStyle={{ flex: 1, fontFamily: Font.medium }}>
                {u.username}
              </NativeTypography>
              <GlassButton title="Accept" onPress={() => accept(u.id)} variant="chipActive" size="small" />
              <GlassButton title="Decline" onPress={() => reject(u.id)} variant="chip" size="small" />
            </View>
          ))}
        </GlassCard>
      ) : null}

      <NativeTypography variant="section" color={colors.textPrimary} textStyle={{ paddingHorizontal: 4 }}>
        {`Friends (${friends.length})`}
      </NativeTypography>
    </View>
  );

  if (!isLoggedIn || loading) {
    return (
      <NativeScreen contentStyle={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={accent.electricBlue} />
      </NativeScreen>
    );
  }

  return (
    <NativeScreen contentStyle={{ paddingHorizontal: 0 }}>
      <FlatList
        data={friends}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
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
          const isLive = friendLocations.some((f) => f.username === item.username);
          const statusText = isLive ? 'Sharing location' : 'Not sharing live location';
          return (
            <Pressable onPress={() => focusFriend(item.username)}>
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
                    }}>
                    <Ionicons name="person" size={20} color={isLive ? accent.coral : accent.electricBlue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <NativeTypography
                      variant="body"
                      color={colors.textPrimary}
                      textStyle={{ fontFamily: Font.semibold }}>
                      {item.username}
                    </NativeTypography>
                    <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginTop: 2 }}>
                      {statusText}
                    </NativeTypography>
                  </View>
                  {isLive ? <View style={[styles.liveDot, { backgroundColor: accent.coral }]} /> : null}
                </View>
              </GlassCard>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <GlassCard borderRadius={16} intensity="light" style={{ padding: 20, alignItems: 'center' }}>
            <Ionicons name="people-outline" size={36} color={colors.textMuted} />
            <NativeTypography
              variant="body"
              color={colors.textMuted}
              textStyle={{ marginTop: 10, textAlign: 'center' }}>
              No friends yet. Open Manage to invite or join a circle.
            </NativeTypography>
          </GlassCard>
        }
      />
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  mapBox: {
    height: 240,
    borderRadius: 20,
    overflow: 'visible',
    borderWidth: 1,
    paddingTop: 20,
  },
  mapClip: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
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
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
