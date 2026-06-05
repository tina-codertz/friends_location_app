import type { MapCoordinate, MapRegion } from '@/types/map';
import type { LocationHistoryEntry, LocationHistorySource } from '@/types/location';

/** Free-tier retention window; server purge can be added later via Cloud Functions. */
export const LOCATION_HISTORY_RETENTION_DAYS = 2;
export const LOCATION_HISTORY_MAX_POINTS = 250;

export type HistoryRangeFilter = '24h' | 'today' | '7d';

export type HistoryDayGroup = {
  dayKey: string;
  label: string;
  entries: LocationHistoryEntry[];
};

export function historyRetentionSinceMs(): number {
  return Date.now() - LOCATION_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
}

export function rangeFilterSinceMs(filter: HistoryRangeFilter): number {
  const now = new Date();
  if (filter === '24h') return Date.now() - 24 * 60 * 60 * 1000;
  if (filter === '7d') return Date.now() - 7 * 24 * 60 * 60 * 1000;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return start.getTime();
}

export function applyRetention(entries: LocationHistoryEntry[]): LocationHistoryEntry[] {
  const since = historyRetentionSinceMs();
  return entries.filter((e) => Date.parse(e.timestamp) >= since);
}

export function filterByRange(
  entries: LocationHistoryEntry[],
  filter: HistoryRangeFilter,
): LocationHistoryEntry[] {
  const since = rangeFilterSinceMs(filter);
  return entries.filter((e) => Date.parse(e.timestamp) >= since);
}

export function filterBySource(
  entries: LocationHistoryEntry[],
  source: LocationHistorySource | 'all',
): LocationHistoryEntry[] {
  if (source === 'all') return entries;
  return entries.filter((e) => e.source === source);
}

export function sortHistoryChronological(entries: LocationHistoryEntry[]): LocationHistoryEntry[] {
  return [...entries].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

export function historyRouteCoordinates(entries: LocationHistoryEntry[]): MapCoordinate[] {
  return sortHistoryChronological(entries).map((e) => ({
    latitude: e.latitude,
    longitude: e.longitude,
  }));
}

export function groupHistoryByDay(entries: LocationHistoryEntry[]): HistoryDayGroup[] {
  const sorted = [...entries].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const groups = new Map<string, LocationHistoryEntry[]>();

  for (const entry of sorted) {
    const dayKey = entry.timestamp.slice(0, 10);
    const bucket = groups.get(dayKey);
    if (bucket) bucket.push(entry);
    else groups.set(dayKey, [entry]);
  }

  return [...groups.entries()].map(([dayKey, dayEntries]) => ({
    dayKey,
    label: formatDayLabel(dayKey),
    entries: dayEntries,
  }));
}

function formatDayLabel(dayKey: string): string {
  const date = new Date(`${dayKey}T12:00:00`);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (dayKey === todayKey) return 'Today';
  if (dayKey === yesterdayKey) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatHistoryTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function sourceLabel(source: LocationHistorySource): string {
  switch (source) {
    case 'background':
      return 'Background';
    case 'foreground':
      return 'Map';
    case 'app-open':
      return 'App open';
    case 'manual':
      return 'Manual';
    default:
      return source;
  }
}

export function regionForCoordinates(points: MapCoordinate[]): MapRegion | null {
  if (points.length === 0) return null;

  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }

  let minLat = points[0].latitude;
  let maxLat = minLat;
  let minLng = points[0].longitude;
  let maxLng = minLng;

  for (const p of points) {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  }

  const latSpan = Math.max(maxLat - minLat, 0.005);
  const lngSpan = Math.max(maxLng - minLng, 0.005);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latSpan * 1.5,
    longitudeDelta: lngSpan * 1.5,
  };
}
