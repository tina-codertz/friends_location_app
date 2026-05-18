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

let placesSchemaReady: Promise<void> | null = null;

/** Ensures saved_places exists (remote D1 may not have run 0003 migration yet). */
function ensurePlacesTable(db: D1Database): Promise<void> {
  if (!placesSchemaReady) {
    placesSchemaReady = (async () => {
      await db
        .prepare(
          `CREATE TABLE IF NOT EXISTS saved_places (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )`
        )
        .run();
      await db
        .prepare(`CREATE INDEX IF NOT EXISTS idx_saved_places_user ON saved_places(user_id)`)
        .run();
    })();
  }
  return placesSchemaReady;
}

export class PlacesService {
  constructor(private db: D1Database) {}

  private async ready() {
    await ensurePlacesTable(this.db);
  }

  async listMine(userId: number) {
    await this.ready();
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
    await this.ready();
    const { results } = await this.db
      .prepare(
        `SELECT sp.id, sp.user_id, u.username, sp.name, sp.lat, sp.lng, sp.created_at
         FROM saved_places sp
         JOIN users u ON u.id = sp.user_id
         WHERE sp.user_id = ?
            OR EXISTS (
              SELECT 1 FROM friendships f
              WHERE (f.user_low = ? AND f.user_high = sp.user_id)
                 OR (f.user_high = ? AND f.user_low = sp.user_id)
            )
         ORDER BY u.username ASC, sp.created_at DESC`
      )
      .bind(viewerId, viewerId, viewerId)
      .all();
    return results as SavedPlaceRow[];
  }

  async create(userId: number, name: string, lat: number, lng: number) {
    await this.ready();
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
      .first()) as SavedPlaceRow | null;

    if (!row) {
      return { success: false as const, message: 'Failed to save place' };
    }

    return { success: true as const, place: row };
  }

  async remove(userId: number, placeId: number) {
    await this.ready();
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
