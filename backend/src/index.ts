/**
 * Cloudflare Workers - Friends Location App Backend
 * Hono.js Framework with D1 Database
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './routes/auth.routes';

// Environment types
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors());

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'Friends Location API is live!',
    version: '1.0.0',
  });
});

// Routes
app.route('/auth', auth);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: 'Route not found',
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json(
    {
      success: false,
      message: 'Internal server error',
    },
    500
  );
});

export default app;