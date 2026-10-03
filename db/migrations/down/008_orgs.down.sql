-- IslandReady AI — rollback for db/migrations/008_orgs.sql (Phase 11).
-- Drops only objects created by 008, in dependency-safe order.
-- Safe for the development database.
-- Run (only after approval): psql $DATABASE_URL -f down/008_orgs.down.sql

BEGIN;

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS org_checklist_state;
DROP TABLE IF EXISTS org_checks;
DROP TABLE IF EXISTS organization_memberships;
DROP TABLE IF EXISTS organizations;
ALTER TABLE users DROP COLUMN IF EXISTS is_platform_admin;

COMMIT;
