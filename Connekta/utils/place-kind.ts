import type { Ionicons } from '@expo/vector-icons';
import type { PlaceKind, SavedPlace } from '@/types/places';

export const PLACE_KINDS: PlaceKind[] = ['home', 'office', 'gym', 'school', 'other'];

const KIND_SET = new Set<string>(PLACE_KINDS);

export type PlaceKindMeta = {
  label: string;
  shortLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const PLACE_KIND_META: Record<PlaceKind, PlaceKindMeta> = {
  home: { label: 'Home', shortLabel: 'HOME', icon: 'home' },
  office: { label: 'Office', shortLabel: 'OFFICE', icon: 'business' },
  gym: { label: 'Gym', shortLabel: 'GYM', icon: 'barbell' },
  school: { label: 'School', shortLabel: 'SCHOOL', icon: 'school' },
  other: { label: 'Place', shortLabel: 'PLACE', icon: 'location' },
};

export function isPlaceKind(value: unknown): value is PlaceKind {
  return typeof value === 'string' && KIND_SET.has(value);
}

/** Guess category from the place name (for older saves without `kind`). */
export function inferPlaceKindFromName(name: string): PlaceKind {
  const n = name.trim().toLowerCase();
  if (!n) return 'other';
  if (/\b(home|house|apartment|apt|flat)\b/.test(n) || n === 'home') return 'home';
  if (/\b(office|work|hq|workplace|desk)\b/.test(n) || n === 'office') return 'office';
  if (/\b(gym|fitness|workout|yoga)\b/.test(n)) return 'gym';
  if (/\b(school|campus|college|university|class)\b/.test(n)) return 'school';
  return 'other';
}

export function resolvePlaceKind(place: Pick<SavedPlace, 'kind' | 'name'>): PlaceKind {
  if (place.kind && isPlaceKind(place.kind)) return place.kind;
  return inferPlaceKindFromName(place.name);
}

export function placeKindLabel(kind: PlaceKind): string {
  return PLACE_KIND_META[kind].label;
}
