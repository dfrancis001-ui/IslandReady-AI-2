-- IslandReady AI — rollback for db/migrations/004_family_plan.sql (Phase 5).
-- Drops only objects created by 004, in dependency-safe order.
-- Safe for the development database.
-- Run (only after approval): psql $DATABASE_URL -f down/004_family_plan.down.sql

BEGIN;

DROP TABLE IF EXISTS family_roles;
DROP TABLE IF EXISTS family_contacts;
DROP TABLE IF EXISTS family_plans;

COMMIT;
