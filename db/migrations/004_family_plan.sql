-- IslandReady AI — Phase 5 migration: Family Emergency Plan (WHO / WHERE / WHAT NEXT).
-- Version: 1. One plan per household; contacts and roles as owned line items.
-- Run (only after review): psql $DATABASE_URL -f 004_family_plan.sql
--
-- Scope: family_plans + family_contacts + family_roles, all scoped to
-- households(id) with ON DELETE CASCADE. No per-category preparedness data
-- (Phase 3 owns that). No seed data. No destructive statements.
-- Rollback: db/migrations/down/004_family_plan.down.sql

BEGIN;

CREATE TABLE IF NOT EXISTS family_plans (
  household_id         TEXT PRIMARY KEY REFERENCES households(id) ON DELETE CASCADE,
  meeting_point        TEXT NOT NULL CHECK (char_length(meeting_point) BETWEEN 1 AND 200),
  backup_meeting_point TEXT NOT NULL DEFAULT '',
  evacuation_info      TEXT NOT NULL DEFAULT '',
  comms_plan           TEXT NOT NULL DEFAULT '',
  next_steps           TEXT NOT NULL DEFAULT '',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS family_contacts (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  label        TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 100),
  phone        TEXT NOT NULL CHECK (char_length(phone) BETWEEN 1 AND 30),
  note         TEXT NOT NULL DEFAULT '',
  position     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS family_roles (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id   TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_label   TEXT NOT NULL CHECK (char_length(member_label) BETWEEN 1 AND 100),
  responsibility TEXT NOT NULL CHECK (char_length(responsibility) BETWEEN 1 AND 200),
  position       INTEGER NOT NULL DEFAULT 0
);

COMMIT;
