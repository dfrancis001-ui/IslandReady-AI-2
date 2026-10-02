-- IslandReady AI — Phase 2 migration: households and household members.
-- Version: 1. Must apply BEFORE db/migrations/001_readiness.sql, which
-- declares household_checklist_state.household_id TEXT REFERENCES households(id).
-- Run (only after approval): psql $DATABASE_URL -f 000_households.sql
--
-- Scope (Phase 2 contract):
--   - households + household_members tables, household_need_flags view.
--   - Phase 1 owns `users` and `household_memberships`; they are NOT created here.
--   - No per-category preparedness columns (Phase 3 household_checklist_state owns those).
--   - No seed/sample data. No destructive statements (no DROP/DELETE/TRUNCATE).
-- Rollback: db/migrations/down/000_households.down.sql

BEGIN;

CREATE TABLE IF NOT EXISTS households (
  id             TEXT PRIMARY KEY,
  community      TEXT NOT NULL,
  country        TEXT NOT NULL DEFAULT 'Saint Lucia',
  small_business BOOLEAN NOT NULL DEFAULT FALSE,
  has_pets       BOOLEAN NOT NULL DEFAULT FALSE,
  pets_notes     TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS household_members (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id   TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  label          TEXT NOT NULL,
  age_group      TEXT NOT NULL CHECK (age_group IN ('baby', 'child', 'adult', 'elderly')),
  mobility_needs BOOLEAN NOT NULL DEFAULT FALSE,
  medical_needs  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rollup matching the Phase 3 engine contract: household["members"] flags
-- baby / elderly / mobility / pets (see engine/readiness_v1.py household_needs).
CREATE OR REPLACE VIEW household_need_flags AS
SELECT h.id AS household_id,
  EXISTS (SELECT 1 FROM household_members m
          WHERE m.household_id = h.id AND m.age_group = 'baby') AS baby,
  EXISTS (SELECT 1 FROM household_members m
          WHERE m.household_id = h.id AND m.age_group = 'elderly') AS elderly,
  EXISTS (SELECT 1 FROM household_members m
          WHERE m.household_id = h.id AND m.mobility_needs) AS mobility,
  h.has_pets AS pets
FROM households h;

COMMIT;
