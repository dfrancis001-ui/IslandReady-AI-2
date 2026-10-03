-- IslandReady AI — Phase 10 migration: Recovery Hub records, photos, tasks.
-- Version: 1. One photo max per record is enforced in application logic
-- (409 on second upload); household task checklist; all rows household- or
-- record-scoped with ON DELETE CASCADE. Photo binaries live on the local
-- filesystem (see UPLOAD_DIR); only metadata is stored here.
-- Run (only after review): psql $DATABASE_URL -f 007_recovery.sql
-- Rollback: db/migrations/down/007_recovery.down.sql

BEGIN;

CREATE TABLE IF NOT EXISTS recovery_records (
  id           TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 150),
  note         TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recovery_photos (
  id          TEXT PRIMARY KEY,
  record_id   TEXT NOT NULL UNIQUE REFERENCES recovery_records(id) ON DELETE CASCADE,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,
  mime        TEXT NOT NULL CHECK (mime IN ('image/jpeg', 'image/png')),
  bytes       INTEGER NOT NULL CHECK (bytes > 0 AND bytes <= 5242880),
  stored_path TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recovery_tasks (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  label        TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 200),
  done         BOOLEAN NOT NULL DEFAULT FALSE,
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
