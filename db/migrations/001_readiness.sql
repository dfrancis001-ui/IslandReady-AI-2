-- IslandReady AI — Phase 3 migration: readiness categories, checklist items, state.
-- Version: 1 (readiness model v1). Requires Phase 2 `households(id)` table.
-- Database: PostgreSQL. Run: psql $DATABASE_URL -f 001_readiness.sql

BEGIN;

-- 10 readiness categories (PRD F1). Weights sum to 100 (see docs/readiness_weights_v1.md).
CREATE TABLE IF NOT EXISTS readiness_categories (
  key    TEXT PRIMARY KEY,
  label  TEXT NOT NULL,
  weight INTEGER NOT NULL CHECK (weight > 0)
);

-- Checklist items. Category weight is split equally across its items.
-- Tags drive household personalization in the Next Best Action generator
-- (baby / elderly / mobility / pets / general).
CREATE TABLE IF NOT EXISTS checklist_items (
  key           TEXT PRIMARY KEY,
  category_key  TEXT NOT NULL REFERENCES readiness_categories(key),
  title         TEXT NOT NULL,
  detail        TEXT NOT NULL DEFAULT '',
  tags          TEXT[] NOT NULL DEFAULT '{general}'
);

-- Per-household checklist state. One row per (household, item).
-- Phase 2 owns `households`; this FK assumes households(id) exists.
CREATE TABLE IF NOT EXISTS household_checklist_state (
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  item_key     TEXT NOT NULL REFERENCES checklist_items(key),
  done         BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, item_key)
);

COMMIT;
