import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth.routes';
import friends from './routes/friends.routes';
import location from './routes/location.routes';
import emergency from './routes/emergency.routes';
import { handlePublicWebSocket } from './realtime/ws-gateway';


//this defines the enviroment variables and cloudflare bindings available inside your worker 
export type WorkerEnv = {
  database: D1Database;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  REALTIME_HUB: DurableObjectNamespace;
};

const app = new Hono<{ Bindings: WorkerEnv }>();

// Enable CORS for all origins in development
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Type'],
  maxAge: 600,
  credentials: true,
}));

app.get('/', (c) => {
  return c.json({
    message: 'Friends Location API is live!',
    version: '1.1.0',
    realtime: 'GET wss? /realtime/ws?token=JWT',
  });
});

app.all('/realtime/ws', (c) => handlePublicWebSocket(c.req.raw, c.env));

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
