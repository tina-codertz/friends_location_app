import type { Context } from 'hono';
import { realtimeBroadcast } from '../realtime/notify';
import { FriendsService } from '../services/friends.service';
import { LocationService } from '../services/location.service';

export const setLocationSharing = async (c: Context) => {
  const userId = c.get('userId') as number;
  const { enabled } = await c.req.json();
  if (typeof enabled !== 'boolean') {
    return c.json({ success: false, message: 'enabled must be boolean' }, 400);
  }
  const loc = new LocationService(c.env.database);
  const result = await loc.setSharing(userId, enabled);
  return c.json({ success: true, sharing: result.sharing });
};

export const pingLocation = async (c: Context) => {
  const userId = c.get('userId') as number;
  const { lat, lng } = await c.req.json();
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) {
    return c.json({ success: false, message: 'Invalid coordinates' }, 400);
  }
  const loc = new LocationService(c.env.database);
  const result = await loc.ping(userId, la, ln);
  if (result.success) {
    const friends = new FriendsService(c.env.database);
    const targets = await friends.listFriendUserIds(userId);
    const row = (await c.env.database
      .prepare('SELECT username FROM users WHERE id = ?')
      .bind(userId)
      .first()) as { username: string } | null;
    const username = row?.username ?? 'friend';
    const updated_at = new Date().toISOString();
    c.executionCtx.waitUntil(
      realtimeBroadcast(c.env, targets, 'location_update', {
        id: userId,
        username,
        lat: la,
        lng: ln,
        updated_at,
      })
    );
  }
  return c.json(result, result.success ? 200 : 403);
};

export const friendsLocations = async (c: Context) => {
  const userId = c.get('userId') as number;
  const loc = new LocationService(c.env.database);
  const locations = await loc.friendsLocations(userId);
  return c.json({ success: true, locations });
};

export const myLocationState = async (c: Context) => {
  const userId = c.get('userId') as number;
  const loc = new LocationService(c.env.database);
  const state = await loc.getMyState(userId);
  return c.json({ success: true, ...state });
};
