/**
 * Auth Controller - Request handlers
 */

import { Context } from 'hono';
import { AuthService } from '../services/auth.services';

export const register = async (c: Context) => {
  try {
    const { email, username, device_id } = await c.req.json();

    // Validation
    if (!email || !username || !device_id) {
      return c.json(
        {
          success: false,
          message: 'Email, username, and device_id are required',
        },
        400
      );
    }

    const authService = new AuthService(c.env.database, c.env.JWT_SECRET, c.env.RESEND_API_KEY);
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

export const verifyOTP = async (c: Context) => {
  try {
    const { email, code } = await c.req.json();

    // Validation
    if (!email || !code) {
      return c.json(
        {
          success: false,
          message: 'Email and OTP code are required',
        },
        400
      );
    }

    const authService = new AuthService(c.env.database, c.env.JWT_SECRET, c.env.RESEND_API_KEY);
    const result = await authService.verifyOTP(email, code);

    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('Verify OTP handler error:', error);
    return c.json(
      {
        success: false,
        message: 'OTP verification failed',
      },
      500
    );
  }
};

export const login = async (c: Context) => {
  try {
    const { username, device_id } = await c.req.json();

    // Validation
    if (!username || !device_id) {
      return c.json(
        {
          success: false,
          message: 'Username and device_id are required',
        },
        400
      );
    }

    const authService = new AuthService(c.env.database, c.env.JWT_SECRET, c.env.RESEND_API_KEY);
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
