export type FriendLocation = {
  id: string;
  username: string;
  lat: number;
  lng: number;
  updated_at: string;
  share_until?: string | null;
};

export type LocationHistoryEntry = {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  source: 'foreground' | 'background' | 'manual' | 'app-open';
  timestamp: string;
};
