import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { ConnektaMap, type ConnektaMapRef } from '@/components/map/ConnektaMap';
import { HistoryRouteLayer } from '@/components/map/HistoryRouteLayer';
import { useAppTheme } from '@/context/ThemeContext';
import { Font, Type } from '@/constants/typography';
import { locationAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { LocationHistoryEntry, LocationHistorySource } from '@/types/location';
import {
  applyRetention,
  filterByRange,
  filterBySource,
  formatHistoryTime,
  groupHistoryByDay,
  historyRouteCoordinates,
  LOCATION_HISTORY_MAX_POINTS,
  LOCATION_HISTORY_RETENTION_DAYS,
  rangeFilterSinceMs,
  regionForCoordinates,
  sourceLabel,
  type HistoryRangeFilter,
} from '@/utils/location-history';

const RANGE_FILTERS: { id: HistoryRangeFilter; label: string }[] = [
  { id: '24h', label: '24h' },
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
];

const SOURCE_FILTERS: { id: LocationHistorySource | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'background', label: 'Background' },
  { id: 'foreground', label: 'Map' },
  { id: 'app-open', label: 'App open' },
];

export default function LocationHistory() {
  const insets = useSafeAreaInsets();
  const { colors, accent } = useAppTheme();
  const { user } = useAuth();
  const mapRef = useRef<ConnektaMapRef>(null);

  const [allLocations, setAllLocations] = useState<LocationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rangeFilter, setRangeFilter] = useState<HistoryRangeFilter>('24h');
  const [sourceFilter, setSourceFilter] = useState<LocationHistorySource | 'all'>('all');
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const loadLocationHistory = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        if (user?.uid) {
          const sinceMs = rangeFilterSinceMs('7d');
          const res = await locationAPI.history({
            max: LOCATION_HISTORY_MAX_POINTS,
            sinceMs,
          });
          const next = res.success ? applyRetention(res.locations) : [];
          setAllLocations(next);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load location history.');
        console.error('Error loading location history:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.uid],
  );

  useFocusEffect(
    useCallback(() => {
      void loadLocationHistory();
    }, [loadLocationHistory]),
  );

  const filteredLocations = useMemo(() => {
    let list = filterByRange(allLocations, rangeFilter);
    list = filterBySource(list, sourceFilter);
    if (selectedDayKey) {
      list = list.filter((e) => e.timestamp.slice(0, 10) === selectedDayKey);
    }
    return list;
  }, [allLocations, rangeFilter, sourceFilter, selectedDayKey]);

  const routeCoordinates = useMemo(
    () => historyRouteCoordinates(filteredLocations),
    [filteredLocations],
  );

  const mapRegion = useMemo(() => regionForCoordinates(routeCoordinates), [routeCoordinates]);

  const dayGroups = useMemo(() => {
    let list = filterByRange(allLocations, rangeFilter);
    list = filterBySource(list, sourceFilter);
    return groupHistoryByDay(list);
  }, [allLocations, rangeFilter, sourceFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadLocationHistory({ silent: true });
  }, [loadLocationHistory]);

  const onSelectDay = useCallback(
    (dayKey: string) => {
      setSelectedDayKey((prev) => (prev === dayKey ? null : dayKey));
    },
    [],
  );

  React.useEffect(() => {
    if (mapRegion) mapRef.current?.flyTo(mapRegion, 600);
  }, [mapRegion, selectedDayKey, rangeFilter, sourceFilter]);

  const summaryText =
    filteredLocations.length === 0
      ? 'No points in this range'
      : `${filteredLocations.length} point${filteredLocations.length === 1 ? '' : 's'}${
          selectedDayKey ? ' · day selected' : ''
        }`;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={[styles.mapWrap, { borderColor: colors.divider }]}>
        {mapRegion ? (
          <ConnektaMap
            ref={mapRef}
            style={styles.map}
            initialRegion={mapRegion}
            showUserLocation={false}
            scrollEnabled
            zoomEnabled
            rotateEnabled={false}
            pitchEnabled={false}
            fallbackMessage="Map unavailable"
          >
            <HistoryRouteLayer
              coordinates={routeCoordinates}
              strokeColor={accent.electricBlue}
            />
          </ConnektaMap>
        ) : (
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.mapBg }]}>
            {loading ? (
              <ActivityIndicator color={accent.cyan} />
            ) : (
              <>
                <Ionicons name="map-outline" size={36} color={colors.textMuted} />
                <Text style={[Type.caption, { color: colors.textMuted, marginTop: 8 }]}>
                  Route appears when history has 2+ points
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 40,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent.cyan} />
        }
      >
        <Text style={[Type.hero, { color: colors.textPrimary, marginBottom: 8 }]}>Location History</Text>
        <Text style={[Type.body, { color: colors.textMuted, marginBottom: 12 }]}>
          Your movement trail from live sharing. Kept for {LOCATION_HISTORY_RETENTION_DAYS} days.
        </Text>

        <View style={styles.chipRow}>
          {RANGE_FILTERS.map((chip) => {
            const active = rangeFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => {
                  setRangeFilter(chip.id);
                  setSelectedDayKey(null);
                }}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? accent.electricBlue : colors.divider,
                    backgroundColor: active ? `${accent.electricBlue}22` : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    Type.caption,
                    {
                      color: active ? colors.textPrimary : colors.textMuted,
                      fontFamily: active ? Font.semibold : Font.regular,
                    },
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sourceRow}>
          {SOURCE_FILTERS.map((chip) => {
            const active = sourceFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => {
                  setSourceFilter(chip.id);
                  setSelectedDayKey(null);
                }}
                style={[
                  styles.sourceChip,
                  {
                    borderColor: active ? accent.cyan : colors.divider,
                    backgroundColor: active ? `${accent.cyan}18` : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    Type.caption,
                    {
                      color: active ? colors.textPrimary : colors.textMuted,
                      fontFamily: active ? Font.semibold : Font.regular,
                    },
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 16 }]}>{summaryText}</Text>

        {loading ? (
          <GlassCard borderRadius={16} intensity="light" style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator color={accent.cyan} />
            <Text style={[Type.body, { color: colors.textMuted, marginTop: 12 }]}>Loading history…</Text>
          </GlassCard>
        ) : dayGroups.length === 0 ? (
          <GlassCard borderRadius={16} intensity="light" style={{ padding: 20, alignItems: 'center' }}>
            <Ionicons name="map" size={40} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={[Type.body, { color: colors.textMuted }]}>No location history</Text>
            <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4, textAlign: 'center' }]}>
              Enable live sharing to build a trail. Points appear as you move.
            </Text>
          </GlassCard>
        ) : (
          dayGroups.map((group) => {
            const daySelected = selectedDayKey === group.dayKey;
            return (
              <View key={group.dayKey} style={{ marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => onSelectDay(group.dayKey)}
                  activeOpacity={0.8}
                  style={[
                    styles.dayHeader,
                    {
                      backgroundColor: daySelected ? `${accent.electricBlue}18` : colors.glassBgLight,
                      borderColor: daySelected ? accent.electricBlue : colors.divider,
                    },
                  ]}
                >
                  <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>
                    {group.label}
                  </Text>
                  <Text style={[Type.caption, { color: colors.textMuted }]}>
                    {group.entries.length} point{group.entries.length === 1 ? '' : 's'}
                  </Text>
                </TouchableOpacity>

                {group.entries.map((item) => (
                  <GlassCard
                    key={item.id}
                    borderRadius={14}
                    intensity="light"
                    style={{ marginTop: 8, padding: 12, opacity: selectedDayKey && !daySelected ? 0.45 : 1 }}
                  >
                    <View style={styles.entryRow}>
                      <View
                        style={[
                          styles.entryIcon,
                          { backgroundColor: daySelected ? accent.electricBlue : `${accent.electricBlue}88` },
                        ]}
                      >
                        <Ionicons name="navigate" size={18} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.medium }]}>
                          {formatHistoryTime(item.timestamp)}
                        </Text>
                        <Text style={[Type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                          {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                        </Text>
                        <Text style={[Type.caption, { color: colors.textMuted, marginTop: 2 }]}>
                          {sourceLabel(item.source)}
                          {item.accuracy != null ? ` · ±${Math.round(item.accuracy)}m` : ''}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mapWrap: {
    height: 220,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  map: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  scroll: { flex: 1 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
  },
  sourceRow: {
    marginBottom: 12,
  },
  sourceChip: {
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
