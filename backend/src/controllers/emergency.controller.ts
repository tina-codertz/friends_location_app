import type { Context } from 'hono';
import { EmergencyService } from '../services/emergency.service';

export const listEmergency = async (c: Context) => {
  const userId = c.get('userId') as number;
  const svc = new EmergencyService(c.env.database);
  const contacts = await svc.list(userId);
  return c.json({ success: true, contacts });
};

export const addEmergency = async (c: Context) => {
  const userId = c.get('userId') as number;
  const { name, phone } = await c.req.json();
  if (!name || !phone || String(name).trim().length < 1 || String(phone).trim().length < 3) {
    return c.json({ success: false, message: 'Name and phone required' }, 400);
  }
  const svc = new EmergencyService(c.env.database);
  await svc.add(userId, String(name), String(phone));
  return c.json({ success: true });
};

export const deleteEmergency = async (c: Context) => {
  const userId = c.get('userId') as number;
  const id = Number(c.req.param('id'));
  if (!id) {
    return c.json({ success: false, message: 'Invalid id' }, 400);
  }
  const svc = new EmergencyService(c.env.database);
  await svc.remove(userId, id);
  return c.json({ success: true });
};
