interface D1Database {
  prepare(sql: string): any;
}

export type FriendRealtimeNotify =
  | { event: 'friend_request'; targets: number[]; data: { from_user_id: number } }
  | { event: 'friend_accepted'; targets: number[]; data: Record<string, never> };

export class FriendsService {
  constructor(private db: D1Database) {}

  private async areFriends(a: number, b: number): Promise<boolean> {
    const low = Math.min(a, b);
    const high = Math.max(a, b);
    const row = await this.db
      .prepare('SELECT 1 FROM friendships WHERE user_low = ? AND user_high = ?')
      .bind(low, high)
      .first();
    return !!row;
  }

  async searchUsers(excludeUserId: number, query: string, limit = 20) {
    const q = `%${query.replace(/%/g, '')}%`;
    const { results } = await this.db
      .prepare(
        `SELECT id, username FROM users
         WHERE verified = 1 AND id != ? AND username LIKE ?
         ORDER BY username ASC LIMIT ?`
      )
      .bind(excludeUserId, q, limit)
      .all();
    return results as { id: number; username: string }[];
  }

  async sendRequest(
    fromUserId: number,
    toUserId: number
  ): Promise<
    | { success: false; message: string }
    | { success: true; message: string; notify: FriendRealtimeNotify }
  > {
    if (fromUserId === toUserId) {
      return { success: false as const, message: 'Cannot add yourself' };
    }
    if (await this.areFriends(fromUserId, toUserId)) {
      return { success: false as const, message: 'Already friends' };
    }

    const existing = (await this.db
      .prepare(
        `SELECT id, status, from_user_id, to_user_id FROM friend_requests
         WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)`
      )
      .bind(fromUserId, toUserId, toUserId, fromUserId)
      .first()) as { id: number; status: string; from_user_id: number; to_user_id: number } | undefined;

    if (existing) {
      if (existing.status === 'pending') {
        if (existing.from_user_id === toUserId && existing.to_user_id === fromUserId) {
          const ar = await this.acceptRequest(fromUserId, existing.from_user_id);
          if (!ar.success) {
            return ar;
          }
          return {
            success: true,
            message: ar.message,
            notify: ar.notify,
          };
        }
        return { success: false as const, message: 'Request already pending' };
      }
      if (existing.status === 'accepted') {
        return { success: false as const, message: 'Already connected' };
      }
      if (existing.status === 'rejected') {
        await this.db
          .prepare('DELETE FROM friend_requests WHERE id = ?')
          .bind(existing.id)
          .run();
      }
    }

    try {
      await this.db
        .prepare(
          `INSERT INTO friend_requests (from_user_id, to_user_id, status) VALUES (?, ?, 'pending')`
        )
        .bind(fromUserId, toUserId)
        .run();
      return {
        success: true,
        message: 'Friend request sent',
        notify: {
          event: 'friend_request',
          targets: [toUserId],
          data: { from_user_id: fromUserId },
        },
      };
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      if (msg.includes('UNIQUE')) {
        return { success: false as const, message: 'Duplicate request' };
      }
      throw e;
    }
  }

  async acceptRequest(
    currentUserId: number,
    fromUserId: number
  ): Promise<
    | { success: false; message: string }
    | { success: true; message: string; notify: FriendRealtimeNotify }
  > {
    const row = (await this.db
      .prepare(
        `SELECT id FROM friend_requests
         WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'`
      )
      .bind(fromUserId, currentUserId)
      .first()) as { id: number } | undefined;

    if (!row) {
      if (await this.areFriends(fromUserId, currentUserId)) {
        return {
          success: true,
          message: 'Already in your circle',
          notify: {
            event: 'friend_accepted',
            targets: [fromUserId, currentUserId],
            data: {},
          },
        };
      }
      const stale = (await this.db
        .prepare(
          `SELECT id FROM friend_requests
           WHERE from_user_id = ? AND to_user_id = ? AND status = 'accepted'`
        )
        .bind(fromUserId, currentUserId)
        .first()) as { id: number } | undefined;
      if (stale) {
        const low = Math.min(fromUserId, currentUserId);
        const high = Math.max(fromUserId, currentUserId);
        await this.db
          .prepare(`INSERT OR IGNORE INTO friendships (user_low, user_high) VALUES (?, ?)`)
          .bind(low, high)
          .run();
        return {
          success: true,
          message: 'Already in your circle',
          notify: {
            event: 'friend_accepted',
            targets: [fromUserId, currentUserId],
            data: {},
          },
        };
      }
      return { success: false as const, message: 'No pending request' };
    }

    await this.db
      .prepare(`UPDATE friend_requests SET status = 'accepted' WHERE id = ?`)
      .bind(row.id)
      .run();

    const low = Math.min(fromUserId, currentUserId);
    const high = Math.max(fromUserId, currentUserId);
    await this.db
      .prepare(
        `INSERT OR IGNORE INTO friendships (user_low, user_high) VALUES (?, ?)`
      )
      .bind(low, high)
      .run();

    return {
      success: true,
      message: 'Friend request accepted',
      notify: {
        event: 'friend_accepted',
        targets: [fromUserId, currentUserId],
        data: {},
      },
    };
  }

  async rejectRequest(currentUserId: number, fromUserId: number) {
    const res = await this.db
      .prepare(
        `UPDATE friend_requests SET status = 'rejected'
         WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'`
      )
      .bind(fromUserId, currentUserId)
      .run();
    if (!res.meta?.changes) {
      return { success: false as const, message: 'No pending request' };
    }
    return { success: true as const, message: 'Request rejected' };
  }

  async listFriends(userId: number) {
    const { results } = await this.db
      .prepare(
        `SELECT u.id, u.username FROM friendships f
         JOIN users u ON u.id = CASE WHEN f.user_low = ? THEN f.user_high ELSE f.user_low END
         WHERE f.user_low = ? OR f.user_high = ?`
      )
      .bind(userId, userId, userId)
      .all();
    return results as { id: number; username: string }[];
  }

  async listFriendUserIds(userId: number): Promise<number[]> {
    const rows = await this.listFriends(userId);
    return rows.map((r) => r.id);
  }

  async listIncomingPending(userId: number) {
    const { results } = await this.db
      .prepare(
        `SELECT r.from_user_id AS id, u.username
         FROM friend_requests r
         JOIN users u ON u.id = r.from_user_id
         WHERE r.to_user_id = ? AND r.status = 'pending'`
      )
      .bind(userId)
      .all();
    return results as { id: number; username: string }[];
  }
}
