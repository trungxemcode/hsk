CREATE TABLE IF NOT EXISTS handwriting_samples (
 id TEXT PRIMARY KEY,
 author_hash TEXT NOT NULL,
 label TEXT NOT NULL,
 bitmap TEXT NOT NULL,
 model_version TEXT NOT NULL,
 review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS handwriting_author_day ON handwriting_samples(author_hash,created_at);
CREATE INDEX IF NOT EXISTS handwriting_day ON handwriting_samples(created_at);
CREATE INDEX IF NOT EXISTS handwriting_review ON handwriting_samples(review_status,label);
