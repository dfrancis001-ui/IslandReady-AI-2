-- IslandReady AI — Phase 11 migration: organizations, memberships, continuity checks.
-- Version: 1. Household tables/checklists are NOT modified; org preparedness is
-- a separate domain (own org_checks catalog + per-org state).
-- Run (only after review): psql $DATABASE_URL -f 008_orgs.sql
-- Rollback: db/migrations/down/008_orgs.down.sql

BEGIN;

CREATE TABLE IF NOT EXISTS organizations (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 150),
  kind       TEXT NOT NULL CHECK (kind IN ('business', 'school', 'church', 'hotel', 'NGO', 'government')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_memberships (
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  PRIMARY KEY (user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS org_checks (
  key    TEXT PRIMARY KEY,
  label  TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS org_checklist_state (
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_key        TEXT NOT NULL REFERENCES org_checks(key),
  done            BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, item_key)
);

-- Platform-admin flag (local-dev promotion via scripts/promote-admin.py only;
-- never seeded, never in code). Household auth semantics unchanged.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Minimal audit trail for institutional access: actor + action only.
-- No household rows, IDs, notes, photos, plans, or PII are stored here.
CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Small approved continuity checklist (v1).
INSERT INTO org_checks (key, label, detail) VALUES
  ('org_contacts',  'Emergency contact list posted', 'Key contacts for staff/members, tested quarterly'),
  ('org_comms',     'Backup communications plan',    'Radio/phone tree if networks fail'),
  ('org_roles',     'Continuity roles assigned',     'Who opens, who checks members, who liaises officially'),
  ('org_supplies',  'Essential supplies cached',     'Water, first aid, lighting for the premises'),
  ('org_drill',     'Drill completed',               'Walk-through with members this season')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, detail = EXCLUDED.detail;

COMMIT;
