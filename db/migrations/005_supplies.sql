-- IslandReady AI — Phase 6 migration: Smart Supply Planner (EC$) + v1 catalog seed.
-- Version: 1. Apply after 004. Run: psql $DATABASE_URL -f 005_supplies.sql
--
-- PRICING PROVENANCE (approved): v1 rates decompose the IslandReady PRD/prototype
-- baseline (Water 72 / Food 150 / First-aid 65 / Flashlight 40 / Radio 60 /
-- Hygiene 45 = EC$432 at 4 people x 3 days). These are baseline planning rates,
-- NOT a Saint Lucia market survey and NOT live retail prices. No external
-- pricing APIs, scraping, or retailer integrations.
--
-- QUANTITY RULES (approved, deterministic from people + days + catalog):
--   water:      per_person_day, 1 gal/day,        EC$6.00  (12 x 6.00 = 72.00)
--   food:       per_person_day, 1 ration/day,     EC$12.50 (12 x 12.50 = 150.00)
--   first_aid: per_household kit,                 EC$65.00 (65.00)
--   radio:      per_household radio,              EC$60.00 (60.00)
--   flashlight: ceil(people/2) sets,              EC$20.00 (2 x 20.00 = 40.00)
--   hygiene:    ceil(people/4) packs,            EC$45.00 (1 x 45.00 = 45.00)
-- Fixture totals: 1p/1d = 208.50; 4p/3d = 432.00; 6p/7d = 1052.00.
-- All money in integer cents. Saved lists snapshot lines+prices so future
-- catalog versions never silently rewrite history (pricing_version recorded).
-- Rollback: db/migrations/down/005_supplies.down.sql

BEGIN;

CREATE TABLE IF NOT EXISTS supply_catalog (
  key              TEXT PRIMARY KEY,
  label            TEXT NOT NULL,
  unit             TEXT NOT NULL,
  pricing_kind     TEXT NOT NULL CHECK (pricing_kind IN ('per_person_day', 'per_household', 'per_2_people', 'per_4_people')),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0),
  version          INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS supply_lists (
  id              TEXT PRIMARY KEY,
  household_id    TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  people          INTEGER NOT NULL CHECK (people BETWEEN 1 AND 30),
  days            INTEGER NOT NULL CHECK (days BETWEEN 1 AND 30),
  pricing_version INTEGER NOT NULL,
  total_cents     INTEGER NOT NULL CHECK (total_cents >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supply_list_lines (
  id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  list_id          TEXT NOT NULL REFERENCES supply_lists(id) ON DELETE CASCADE,
  item_key         TEXT NOT NULL REFERENCES supply_catalog(key),
  qty              NUMERIC NOT NULL CHECK (qty > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0),
  line_total_cents INTEGER NOT NULL CHECK (line_total_cents >= 0),
  position         INTEGER NOT NULL DEFAULT 0
);

INSERT INTO supply_catalog (key, label, unit, pricing_kind, unit_price_cents, version) VALUES
  ('water',      'Water',                 'gal',    'per_person_day',  600, 1),
  ('food',       'Canned food + baby food', 'ration', 'per_person_day', 1250, 1),
  ('first_aid',  'First aid + baby meds', 'kit',    'per_household',   6500, 1),
  ('flashlight', 'Flashlight + batteries', 'set',   'per_2_people',    2000, 1),
  ('radio',      'Wind-up radio',         'radio',  'per_household',   6000, 1),
  ('hygiene',    'Hygiene + diapers',     'pack',   'per_4_people',    4500, 1)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label, unit = EXCLUDED.unit, pricing_kind = EXCLUDED.pricing_kind,
  unit_price_cents = EXCLUDED.unit_price_cents, version = EXCLUDED.version;

COMMIT;
