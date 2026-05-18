import type { Context } from 'hono';
import { PlacesService } from '../services/places.service';
import { FriendsService } from '../services/friends.service';
import { realtimeBroadcast } from '../realtime/notify';

export const listMyPlaces = async (c: Context) => {
  const userId = c.get('userId') as number;
  const svc = new PlacesService(c.env.database);
  const places = await svc.listMine(userId);
  return c.json({ success: true, places });
};

export const listCirclePlaces = async (c: Context) => {
  const userId = c.get('userId') as number;
  const svc = new PlacesService(c.env.database);
  const places = await svc.listCircle(userId);
  return c.json({ success: true, places });
};

export const createPlace = async (c: Context) => {
  const userId = c.get('userId') as number;
  const { name, lat, lng } = await c.req.json();
  const svc = new PlacesService(c.env.database);
  const result = await svc.create(userId, String(name ?? ''), Number(lat), Number(lng));
  if (!result.success) {
    return c.json(result, 400);
  }

  const friends = new FriendsService(c.env.database);
  const targets = await friends.listFriendUserIds(userId);
  if (targets.length > 0) {
    c.executionCtx.waitUntil(
      realtimeBroadcast(c.env, targets, 'place_added', {
        place: result.place,
      })
    );
  }

  return c.json({ success: true, place: result.place });
};

export const deletePlace = async (c: Context) => {
  const userId = c.get('userId') as number;
  const placeId = Number(c.req.param('id'));
  if (!Number.isFinite(placeId)) {
    return c.json({ success: false, message: 'Invalid place id' }, 400);
  }
  const svc = new PlacesService(c.env.database);
  const result = await svc.remove(userId, placeId);
  return c.json(result, result.success ? 200 : 404);
};
