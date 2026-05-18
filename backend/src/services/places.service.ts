interface D1Database {
  prepare(sql: string): any;
}

export type SavedPlaceRow = {
  id: number;
  user_id: number;
  username: string;
  name: string;
  lat: number;
  lng: number;
  created_at: string;
};

export class PlacesService {
  constructor(private db: D1Database) {}

  async listMine(userId: number) {
    const { results } = await this.db
      .prepare(
        `SELECT sp.id, sp.user_id, u.username, sp.name, sp.lat, sp.lng, sp.created_at
         FROM saved_places sp
         JOIN users u ON u.id = sp.user_id
         WHERE sp.user_id = ?
         ORDER BY sp.created_at DESC`
      )
      .bind(userId)
      .all();
    return results as SavedPlaceRow[];
  }

  async listCircle(viewerId: number) {
    const { results } = await this.db
      .prepare(
        `SELECT sp.id, sp.user_id, u.username, sp.name, sp.lat, sp.lng, sp.created_at
         FROM saved_places sp
         JOIN users u ON u.id = sp.user_id
         WHERE sp.user_id = ?
            OR sp.user_id IN (
              SELECT CASE WHEN f.user_low = ? THEN f.user_high ELSE f.user_low END
              FROM friendships f
              WHERE f.user_low = ? OR f.user_high = ?
            )
         ORDER BY u.username ASC, sp.created_at DESC`
      )
      .bind(viewerId, viewerId, viewerId, viewerId)
      .all();
    return results as SavedPlaceRow[];
  }

  async create(userId: number, name: string, lat: number, lng: number) {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 80) {
      return { success: false as const, message: 'Place name is required (max 80 chars)' };
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { success: false as const, message: 'Invalid coordinates' };
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { success: false as const, message: 'Coordinates out of range' };
    }

    const result = await this.db
      .prepare(`INSERT INTO saved_places (user_id, name, lat, lng) VALUES (?, ?, ?, ?)`)
      .bind(userId, trimmed, lat, lng)
      .run();

    const id = Number(result.meta?.last_row_id);
    const row = (await this.db
      .prepare(
        `SELECT sp.id, sp.user_id, u.username, sp.name, sp.lat, sp.lng, sp.created_at
         FROM saved_places sp
         JOIN users u ON u.id = sp.user_id
         WHERE sp.id = ?`
      )
      .bind(id)
      .first()) as SavedPlaceRow;

    return { success: true as const, place: row };
  }

  async remove(userId: number, placeId: number) {
    const result = await this.db
      .prepare(`DELETE FROM saved_places WHERE id = ? AND user_id = ?`)
      .bind(placeId, userId)
      .run();
    if (!result.meta?.changes) {
      return { success: false as const, message: 'Place not found' };
    }
    return { success: true as const };
  }
}
