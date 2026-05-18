-- Circle invite codes (one active code per user)
CREATE TABLE IF NOT EXISTS circle_invites (
  user_id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_circle_invites_code ON circle_invites(code);
