import type { Context } from 'hono';
import type { RealtimeEvent } from '../realtime/notify';
import { realtimeBroadcast } from '../realtime/notify';
import { FriendsService } from '../services/friends.service';

export const searchUsers = async (c: Context) => {
  const userId = c.get('userId') as number;
  const q = c.req.query('q') || '';
  if (q.length < 2) {
    return c.json({ success: true, users: [] });
  }
  const friends = new FriendsService(c.env.database);
  const users = await friends.searchUsers(userId, q);
  return c.json({ success: true, users });
};

export const sendFriendRequest = async (c: Context) => {
  const userId = c.get('userId') as number;
  const { to_user_id } = await c.req.json();
  const toId = Number(to_user_id);
  if (!toId || toId < 1) {
    return c.json({ success: false, message: 'Invalid user' }, 400);
  }
  const friends = new FriendsService(c.env.database);
  const result = await friends.sendRequest(userId, toId);
  if (result.success && 'notify' in result) {
    c.executionCtx.waitUntil(
      realtimeBroadcast(c.env, result.notify.targets, result.notify.event as RealtimeEvent, result.notify.data)
    );
  }
  return c.json(result, result.success ? 200 : 400);
};

export const acceptFriendRequest = async (c: Context) => {
  const userId = c.get('userId') as number;
  const { from_user_id } = await c.req.json();
  const fromId = Number(from_user_id);
  if (!fromId) {
    return c.json({ success: false, message: 'Invalid user' }, 400);
  }
  const friends = new FriendsService(c.env.database);
  const result = await friends.acceptRequest(userId, fromId);
  if (result.success && 'notify' in result) {
    c.executionCtx.waitUntil(
      realtimeBroadcast(c.env, result.notify.targets, result.notify.event as RealtimeEvent, result.notify.data)
    );
  }
  return c.json(result, result.success ? 200 : 400);
};

export const rejectFriendRequest = async (c: Context) => {
  const userId = c.get('userId') as number;
  const { from_user_id } = await c.req.json();
  const fromId = Number(from_user_id);
  if (!fromId) {
    return c.json({ success: false, message: 'Invalid user' }, 400);
  }
  const friends = new FriendsService(c.env.database);
  const result = await friends.rejectRequest(userId, fromId);
  return c.json(result, result.success ? 200 : 400);
};

export const listFriends = async (c: Context) => {
  const userId = c.get('userId') as number;
  const friends = new FriendsService(c.env.database);
  const list = await friends.listFriends(userId);
  return c.json({ success: true, friends: list });
};

export const listIncoming = async (c: Context) => {
  const userId = c.get('userId') as number;
  const friends = new FriendsService(c.env.database);
  const incoming = await friends.listIncomingPending(userId);
  return c.json({ success: true, incoming });
};
