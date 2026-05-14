interface D1Database {
  prepare(sql: string): any;
}

export class EmergencyService {
  constructor(private db: D1Database) {}

  async list(userId: number) {
    const { results } = await this.db
      .prepare(
        `SELECT id, name, phone, sort_order FROM emergency_contacts
         WHERE user_id = ? ORDER BY sort_order ASC, id ASC`
      )
      .bind(userId)
      .all();
    return results as { id: number; name: string; phone: string; sort_order: number }[];
  }

  async add(userId: number, name: string, phone: string) {
    const max = (await this.db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM emergency_contacts WHERE user_id = ?')
      .bind(userId)
      .first()) as { n: number } | undefined;
    const sort = max?.n ?? 0;
    await this.db
      .prepare(
        `INSERT INTO emergency_contacts (user_id, name, phone, sort_order) VALUES (?, ?, ?, ?)`
      )
      .bind(userId, name.trim(), phone.trim(), sort)
      .run();
    return { success: true as const };
  }

  async remove(userId: number, contactId: number) {
    await this.db
      .prepare('DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?')
      .bind(contactId, userId)
      .run();
    return { success: true as const };
  }
}
