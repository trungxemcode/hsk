-- Separate music pilot database; no migration of existing learner or voice data.
CREATE TABLE IF NOT EXISTS music_songs (
 id TEXT PRIMARY KEY,
 revision TEXT NOT NULL,
 title TEXT NOT NULL,
 payload TEXT NOT NULL,
 asset_key TEXT UNIQUE,
 file_size_bytes INTEGER NOT NULL DEFAULT 0,
 published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS music_recent ON music_songs(published_at);
