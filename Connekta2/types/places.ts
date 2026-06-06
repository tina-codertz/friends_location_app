export type PlaceKind = 'home' | 'office' | 'gym' | 'school' | 'other';

export type SavedPlace = {
  id: string;
  userId: string;
  username: string;
  name: string;
  /** Optional category — shown as a map badge (Home, Office, …). */
  kind?: PlaceKind;
  lat: number;
  lng: number;
  created_at: string;
};
