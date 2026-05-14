interface D1Database {
  prepare(sql: string): any;
}

export class LocationService {
  constructor(private db: D1Database) {}

  async setSharing(userId: number, enabled: boolean) {
    await this.db
      .prepare(
        `INSERT INTO location_state (user_id, sharing, lat, lng, updated_at)
         VALUES (?, ?, NULL, NULL, datetime('now'))
         ON CONFLICT(user_id) DO UPDATE SET
           sharing = excluded.sharing,
           updated_at = datetime('now')`
      )
      .bind(userId, enabled ? 1 : 0)
      .run();
    return { success: true as const, sharing: enabled };
  }

  async ping(userId: number, lat: number, lng: number) {
    const row = (await this.db
      .prepare('SELECT sharing FROM location_state WHERE user_id = ?')
      .bind(userId)
      .first()) as { sharing: number } | undefined;

    if (!row || !row.sharing) {
      return { success: false as const, message: 'Location sharing is off' };
    }

    await this.db
      .prepare(
        `UPDATE location_state SET lat = ?, lng = ?, updated_at = datetime('now') WHERE user_id = ?`
      )
      .bind(lat, lng, userId)
      .run();

    return { success: true as const };
  }

  /** Friends who share location + last known coords */
  async friendsLocations(viewerId: number) {
    const { results } = await this.db
      .prepare(
        `SELECT u.id, u.username, ls.lat, ls.lng, ls.updated_at
         FROM friendships f
         JOIN users u ON u.id = CASE WHEN f.user_low = ? THEN f.user_high ELSE f.user_low END
         JOIN location_state ls ON ls.user_id = u.id
         WHERE (f.user_low = ? OR f.user_high = ?)
           AND ls.sharing = 1
           AND ls.lat IS NOT NULL AND ls.lng IS NOT NULL`
      )
      .bind(viewerId, viewerId, viewerId)
      .all();

    return results as {
      id: number;
      username: string;
      lat: number;
      lng: number;
      updated_at: string;
    }[];
  }

  async getMyState(userId: number) {
    const row = (await this.db
      .prepare('SELECT sharing, lat, lng, updated_at FROM location_state WHERE user_id = ?')
      .bind(userId)
      .first()) as {
      sharing: number;
      lat: number | null;
      lng: number | null;
      updated_at: string | null;
    } | undefined;
    return {
      sharing: !!row?.sharing,
      lat: row?.lat ?? null,
      lng: row?.lng ?? null,
      updated_at: row?.updated_at ?? null,
    };
  }
}
