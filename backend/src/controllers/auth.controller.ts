import { Context } from 'hono';
import { AuthService } from '../services/auth.services';
import type { WorkerEnv } from '../hono-app';

function createAuthService(c: Context<{ Bindings: WorkerEnv }>) {
  return new AuthService(c.env.database, c.env.JWT_SECRET);
}

export const register = async (c: Context) => {
  try {
    const { email, username, device_id } = await c.req.json();

    if (!email || !username || !device_id) {
      return c.json(
        {
          success: false,
          message: 'Email, username, and device_id are required',
        },
        400
      );
    }

    const authService = createAuthService(c);
    const result = await authService.register(email, username, device_id);

    return c.json(result, result.success ? 201 : 400);
  } catch (error) {
    console.error('Register handler error:', error);
    return c.json(
      {
        success: false,
        message: 'Registration failed',
      },
      500
    );
  }
};

export const checkUsername = async (c: Context) => {
  try {
    const username = c.req.query('username')?.trim();
    if (!username) {
      return c.json({ success: false, message: 'username query is required' }, 400);
    }

    const authService = createAuthService(c);
    const result = await authService.isUsernameAvailable(username);

    return c.json({
      success: true,
      available: result.available,
      message: result.message,
    });
  } catch (error) {
    console.error('Check username handler error:', error);
    return c.json({ success: false, message: 'Could not check username' }, 500);
  }
};

export const login = async (c: Context) => {
  try {
    const { username, device_id } = await c.req.json();

    if (!username || !device_id) {
      return c.json(
        {
          success: false,
          message: 'Username and device_id are required',
        },
        400
      );
    }

    const authService = createAuthService(c);
    const result = await authService.login(username, device_id);

    return c.json(result, result.success ? 200 : 401);
  } catch (error) {
    console.error('Login handler error:', error);
    return c.json(
      {
        success: false,
        message: 'Login failed',
      },
      500
    );
  }
};
