/**
 * Mobile types aligned with D1 schema (backend/migrations/schema.sql).
 * Only fields that exist in the database are modeled here.
 */

/** users */
export interface DbUser {
  id: number;
  email: string;
  username: string;
  device_id: string;
  verified: 0 | 1;
  created_at: string;
}

/** friend_requests.status */
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

/** friend_requests */
export interface DbFriendRequest {
  id: number;
  from_user_id: number;
  to_user_id: number;
  status: FriendRequestStatus;
  created_at: string;
}

/** friendships — mutual link (user_low < user_high) */
export interface DbFriendship {
  user_low: number;
  user_high: number;
  created_at: string;
}

/** location_state — latest point only; sharing is 0|1 in DB */
export interface DbLocationState {
  user_id: number;
  sharing: 0 | 1;
  lat: number | null;
  lng: number | null;
  updated_at: string | null;
}

/** emergency_contacts — no status column in schema */
export interface DbEmergencyContact {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  sort_order: number;
  created_at: string;
}
