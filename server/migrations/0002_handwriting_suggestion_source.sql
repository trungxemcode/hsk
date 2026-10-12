ALTER TABLE handwriting_samples
ADD COLUMN suggestion_source TEXT NOT NULL DEFAULT 'local'
CHECK (suggestion_source IN ('local','ai','manual'));
