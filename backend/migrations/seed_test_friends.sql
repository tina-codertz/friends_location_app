-- Test data: mutual friends + live locations for Christina (1) and Rosesante (2)
-- Pending request: Tina (3) -> Christina (1)
-- Run: npx wrangler d1 execute database --remote --file=./migrations/seed_test_friends.sql

DELETE FROM friend_requests
WHERE (from_user_id = 1 AND to_user_id = 2) OR (from_user_id = 2 AND to_user_id = 1);

DELETE FROM friendships WHERE user_low = 1 AND user_high = 2;

INSERT INTO friend_requests (from_user_id, to_user_id, status)
VALUES (2, 1, 'accepted');

INSERT INTO friendships (user_low, user_high) VALUES (1, 2);

INSERT INTO location_state (user_id, sharing, lat, lng, updated_at)
VALUES (1, 1, -6.7924, 39.2083, datetime('now'))
ON CONFLICT(user_id) DO UPDATE SET
  sharing = 1,
  lat = -6.7924,
  lng = 39.2083,
  updated_at = datetime('now');

INSERT INTO location_state (user_id, sharing, lat, lng, updated_at)
VALUES (2, 1, -6.7935, 39.2095, datetime('now'))
ON CONFLICT(user_id) DO UPDATE SET
  sharing = 1,
  lat = -6.7935,
  lng = 39.2095,
  updated_at = datetime('now');

INSERT OR IGNORE INTO friend_requests (from_user_id, to_user_id, status)
VALUES (3, 1, 'pending');
