-- Friends, location snapshot (no history), emergency contacts
-- Run: wrangler d1 execute database --remote --file=./migrations/0001_friends_location.sql

CREATE TABLE IF NOT EXISTS friend_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id),
  UNIQUE (from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS friendships (
  user_low INTEGER NOT NULL,
  user_high INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_low, user_high),
  FOREIGN KEY (user_low) REFERENCES users(id),
  FOREIGN KEY (user_high) REFERENCES users(id),
  CHECK (user_low < user_high)
);

CREATE TABLE IF NOT EXISTS location_state (
  user_id INTEGER PRIMARY KEY,
  sharing INTEGER NOT NULL DEFAULT 0,
  lat REAL,
  lng REAL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_user_id, status);
