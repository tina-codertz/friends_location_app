interface D1Database {
  prepare(sql: string): any;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length = 8): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

export class InviteService {
  constructor(private db: D1Database) {}

  async getInvite(userId: number) {
    const row = (await this.db
      .prepare(
        `SELECT code, expires_at, created_at FROM circle_invites
         WHERE user_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))`
      )
      .bind(userId)
      .first()) as { code: string; expires_at: string | null; created_at: string } | undefined;
    return row ?? null;
  }

  async generateInvite(userId: number, ttlDays = 30) {
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

    for (let attempt = 0; attempt < 8; attempt++) {
      const code = randomCode(8);
      try {
        await this.db
          .prepare(
            `INSERT INTO circle_invites (user_id, code, expires_at) VALUES (?, ?, ?)
             ON CONFLICT(user_id) DO UPDATE SET
               code = excluded.code,
               expires_at = excluded.expires_at,
               created_at = datetime('now')`
          )
          .bind(userId, code, expiresAt)
          .run();
        return { success: true as const, code, expires_at: expiresAt };
      } catch (e: unknown) {
        const msg = String((e as { message?: string })?.message ?? e);
        if (msg.includes('UNIQUE') && msg.includes('code')) continue;
        throw e;
      }
    }
    return { success: false as const, message: 'Could not generate unique code' };
  }

  async resolveCode(code: string) {
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normalized.length < 6) {
      return null;
    }
    const row = (await this.db
      .prepare(
        `SELECT ci.user_id, u.username FROM circle_invites ci
         JOIN users u ON u.id = ci.user_id
         WHERE ci.code = ? AND (ci.expires_at IS NULL OR ci.expires_at > datetime('now'))`
      )
      .bind(normalized)
      .first()) as { user_id: number; username: string } | undefined;
    return row ?? null;
  }
}
