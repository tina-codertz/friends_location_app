import type { Context } from 'hono';
import { PlacesService } from '../services/places.service';
import { FriendsService } from '../services/friends.service';
import { realtimeBroadcast } from '../realtime/notify';

function placesError(c: Context, err: unknown) {
  console.error('[places]', err);
  const msg = String((err as { message?: string })?.message ?? err);
  if (msg.includes('no such table')) {
    return c.json(
      {
        success: false,
        message: 'Places database not ready. Restart the backend or run migration 0003_saved_places.sql',
      },
      503
    );
  }
  return c.json({ success: false, message: 'Internal server error' }, 500);
}

export const listMyPlaces = async (c: Context) => {
  try {
    const userId = c.get('userId') as number;
    const svc = new PlacesService(c.env.database);
    const places = await svc.listMine(userId);
    return c.json({ success: true, places });
  } catch (err) {
    return placesError(c, err);
  }
};

export const listCirclePlaces = async (c: Context) => {
  try {
    const userId = c.get('userId') as number;
    const svc = new PlacesService(c.env.database);
    const places = await svc.listCircle(userId);
    return c.json({ success: true, places });
  } catch (err) {
    return placesError(c, err);
  }
};

export const createPlace = async (c: Context) => {
  try {
    const userId = c.get('userId') as number;
    const { name, lat, lng } = await c.req.json();
    const svc = new PlacesService(c.env.database);
    const result = await svc.create(userId, String(name ?? ''), Number(lat), Number(lng));
    if (!result.success) {
      return c.json(result, 400);
    }

    const friends = new FriendsService(c.env.database);
    const targets = await friends.listFriendUserIds(userId);
    if (targets.length > 0 && result.place) {
      c.executionCtx.waitUntil(
        realtimeBroadcast(c.env, targets, 'place_added', {
          place: result.place,
        })
      );
    }

    return c.json({ success: true, place: result.place });
  } catch (err) {
    return placesError(c, err);
  }
};

export const deletePlace = async (c: Context) => {
  try {
    const userId = c.get('userId') as number;
    const placeId = Number(c.req.param('id'));
    if (!Number.isFinite(placeId)) {
      return c.json({ success: false, message: 'Invalid place id' }, 400);
    }
    const svc = new PlacesService(c.env.database);
    const result = await svc.remove(userId, placeId);
    return c.json(result, result.success ? 200 : 404);
  } catch (err) {
    return placesError(c, err);
  }
};
