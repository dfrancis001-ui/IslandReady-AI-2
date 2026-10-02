-- IslandReady AI — rollback for db/migrations/000_households.sql (Phase 2).
-- Safe for the fresh development database: drops only objects created by 000,
-- in dependency-safe order (view, then members, then households).
-- ON DELETE CASCADE rules in 000 mean no orphan rows can survive the drops.
-- Run (only after approval): psql $DATABASE_URL -f down/000_households.down.sql

BEGIN;

DROP VIEW IF EXISTS household_need_flags;
DROP TABLE IF EXISTS household_members;
DROP TABLE IF EXISTS households;

COMMIT;
