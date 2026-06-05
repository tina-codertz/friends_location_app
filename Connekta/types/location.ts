export type FriendLocation = {
  id: string;
  username: string;
  lat: number;
  lng: number;
  updated_at: string;
  share_until?: string | null;
};

export type LocationHistorySource = 'foreground' | 'background' | 'manual' | 'app-open';

export type LocationHistoryEntry = {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  source: LocationHistorySource;
  timestamp: string;
};

export type LocationHistoryQuery = {
  max?: number;
  /** Only return points at or after this Unix ms timestamp. */
  sinceMs?: number;
};
