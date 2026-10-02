-- IslandReady AI — Phase 1 migration: users and household memberships.
-- Version: 1. Numbering is apply-order: runs AFTER 001/002 (no dependency on
-- their tables, but keeps a single chronological chain).
-- Run (only after review): psql $DATABASE_URL -f 003_users_auth.sql
--
-- Decisions recorded (local development only):
--   - Auth.js Credentials provider with JWT sessions (no adapter tables).
--   - Minimal users table; emails normalized to lowercase in application code
--     (no citext); open local signup during development.
--   - users.id is app-generated UUID TEXT (matches households TEXT convention).
--   - password_hash has a length CHECK so plaintext can never be stored.
-- Rollback: db/migrations/down/003_users_auth.down.sql

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL CHECK (char_length(password_hash) >= 50),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS household_memberships (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  PRIMARY KEY (user_id, household_id)
);

COMMIT;
