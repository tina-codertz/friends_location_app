import type { Context } from 'hono';
import { InviteService } from '../services/invite.service';
import { FriendsService } from '../services/friends.service';
import { realtimeBroadcast } from '../realtime/notify';

export const getMyInvite = async (c: Context) => {
  const userId = c.get('userId') as number;
  const svc = new InviteService(c.env.database);
  const invite = await svc.getInvite(userId);
  return c.json({ success: true, invite });
};

export const generateInvite = async (c: Context) => {
  const userId = c.get('userId') as number;
  const svc = new InviteService(c.env.database);
  const result = await svc.generateInvite(userId);
  return c.json(result, result.success ? 200 : 400);
};

export const joinWithCode = async (c: Context) => {
  const userId = c.get('userId') as number;
  const { code } = await c.req.json();
  if (!code || String(code).trim().length < 6) {
    return c.json({ success: false, message: 'Enter a valid invite code' }, 400);
  }

  const invites = new InviteService(c.env.database);
  const owner = await invites.resolveCode(String(code));
  if (!owner) {
    return c.json({ success: false, message: 'Invalid or expired invite code' }, 404);
  }
  if (owner.user_id === userId) {
    return c.json({ success: false, message: 'You cannot use your own invite code' }, 400);
  }

  const friends = new FriendsService(c.env.database);
  const result = await friends.sendRequest(userId, owner.user_id);

  if (result.success && 'notify' in result) {
    c.executionCtx.waitUntil(
      realtimeBroadcast(c.env, result.notify.targets, result.notify.event, result.notify.data)
    );
    const { notify: _n, ...body } = result;
    return c.json({
      ...body,
      circle_owner: { id: owner.user_id, username: owner.username },
    });
  }

  return c.json(
    {
      ...result,
      circle_owner: { id: owner.user_id, username: owner.username },
    },
    result.success ? 200 : 400
  );
};
