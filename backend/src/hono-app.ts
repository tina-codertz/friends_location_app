/**
 * HTTP API (Hono). Imported by the Worker entrypoint alongside WebSocket routing.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth.routes';
import friends from './routes/friends.routes';
import location from './routes/location.routes';
import emergency from './routes/emergency.routes';

export type WorkerEnv = {
  database: D1Database;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  REALTIME_HUB: DurableObjectNamespace;
};

const app = new Hono<{ Bindings: WorkerEnv }>();

app.use('*', cors());

app.get('/', (c) => {
  return c.json({
    message: 'Friends Location API is live!',
    version: '1.1.0',
    realtime: 'GET wss? /realtime/ws?token=JWT',
  });
});

app.route('/auth', auth);
app.route('/friends', friends);
app.route('/location', location);
app.route('/emergency', emergency);

app.notFound((c) => {
  return c.json({ success: false, message: 'Route not found' }, 404);
});

app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json({ success: false, message: 'Internal server error' }, 500);
});

export { app };
