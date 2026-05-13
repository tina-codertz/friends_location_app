/**
 * Auth Services - Business logic for authentication
 */

import { generateOTP } from '../utils/otp';
import { sign } from 'hono/jwt';

// Local D1Database interface
interface D1Database {
  prepare(sql: string): any;
}

interface User {
  id: number;
  email: string;
  username: string;
  device_id: string;
  verified: number;
  created_at: string;
}

export class AuthService {
  private db: D1Database;
  private jwtSecret: string;

  constructor(db: D1Database, jwtSecret: string) {
    this.db = db;
    this.jwtSecret = jwtSecret;
  }

  /**
   * Register a new user
   * Creates user record and sends OTP to email
   */
  async register(
    email: string,
    username: string,
    device_id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if email or username already exists
      const existing = await this.db
        .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
        .bind(email, username)
        .first();

      if (existing) {
        return {
          success: false,
          message: 'Email or username already registered',
        };
      }

      // Create user with verified=0 (awaiting OTP verification)
      await this.db
        .prepare(
          'INSERT INTO users (email, username, device_id, verified) VALUES (?, ?, ?, 0)'
        )
        .bind(email, username, device_id)
        .run();

      // Generate and store OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      await this.db
        .prepare('INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)')
        .bind(email, otp, expiresAt)
        .run();

      // TODO: Send OTP to email (using SendGrid, Mailgun, etc.)
      console.log(`OTP for ${email}: ${otp}`);

      return {
        success: true,
        message: 'Registration initiated. OTP sent to your email.',
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: 'Registration failed',
      };
    }
  }

  /**
   * Verify OTP and mark user as verified
   */
  async verifyOTP(email: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find valid OTP
      const otp = await this.db
        .prepare(
          'SELECT * FROM otp_codes WHERE email = ? AND code = ? AND expires_at > datetime("now")'
        )
        .bind(email, code)
        .first();

      if (!otp) {
        return {
          success: false,
          message: 'Invalid or expired OTP',
        };
      }

      // Mark user as verified
      await this.db
        .prepare('UPDATE users SET verified = 1 WHERE email = ?')
        .bind(email)
        .run();

      // Delete used OTP
      await this.db
        .prepare('DELETE FROM otp_codes WHERE email = ?')
        .bind(email)
        .run();

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        message: 'OTP verification failed',
      };
    }
  }

  /**
   * Login with username and device_id
   * Device must be the same as registered
   */
  async login(
    username: string,
    device_id: string
  ): Promise<{ success: boolean; user?: User; token?: string; message?: string }> {
    try {
      const user = (await this.db
        .prepare('SELECT * FROM users WHERE username = ?')
        .bind(username)
        .first()) as User | undefined;

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Check if user is verified
      if (!user.verified) {
        return {
          success: false,
          message: 'Please verify your email first',
        };
      }

      // Check device_id matches
      if (user.device_id !== device_id) {
        return {
          success: false,
          message: 'Device not registered for this account',
        };
      }

      // Generate JWT token
      const token = await this.generateJWT({
        userId: user.id,
        username: user.username,
        email: user.email,
      });

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed',
      };
    }
  }

  /**
   * Generate JWT token
   */
  private async generateJWT(payload: any): Promise<string> {
    const token = await sign(
      {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      },
      this.jwtSecret
    );
    return token;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User | null> {
    try {
      const user = (await this.db
        .prepare('SELECT * FROM users WHERE id = ?')
        .bind(userId)
        .first()) as User | undefined;

      return user || null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }
}
