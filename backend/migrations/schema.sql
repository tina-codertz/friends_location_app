--- wrangler d1 execute database --remote --file=./migrations/0001_friends_location.sql

--create the users tbis is for authentication 
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  device_id TEXT NOT NULL,
  verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

--create the otp_codes table for storing OTP codes for email verification
CREATE TABLE otp_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at DATETIME NOT NULL
);

--the table for friend requests, with a status field to track pending/accepted/rejected requests
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


--the table for friendships, which is created when a friend request is accepted. We store user_low and user_high to enforce uniqueness and simplify queries.
CREATE TABLE IF NOT EXISTS friendships (
  user_low INTEGER NOT NULL,
  user_high INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_low, user_high),
  FOREIGN KEY (user_low) REFERENCES users(id),
  FOREIGN KEY (user_high) REFERENCES users(id),
  CHECK (user_low < user_high)
);

--the table for storing user's location sharing state and their latest location. Sharing is a boolean indicating if the user is currently sharing their location. Lat and Lng store the latest known location, and updated_at tracks when the location was last updated
CREATE TABLE IF NOT EXISTS location_state (
  user_id INTEGER PRIMARY KEY,
  sharing INTEGER NOT NULL DEFAULT 0,
  lat REAL,
  lng REAL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);


--the table for storing user's emergency contacts. Each contact has a name, phone number, and a sort order to allow users to prioritize their contacts. The user can have multiple emergency contacts, and they are linked to the users table via user_id.
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Saved places (visible to circle); see migrations/0003_saved_places.sql
CREATE TABLE IF NOT EXISTS saved_places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_saved_places_user ON saved_places(user_id);

--indexes to optimize friend request queries by to_user_id and from_user_id, especially when filtering by status
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_user_id, status);
