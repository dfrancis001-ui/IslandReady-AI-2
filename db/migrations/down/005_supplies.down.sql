-- IslandReady AI — rollback for db/migrations/005_supplies.sql (Phase 6).
-- Drops only objects created by 005, in dependency-safe order.
-- Safe for the development database.
-- Run (only after approval): psql $DATABASE_URL -f down/005_supplies.down.sql

BEGIN;

DROP TABLE IF EXISTS supply_list_lines;
DROP TABLE IF EXISTS supply_lists;
DROP TABLE IF EXISTS supply_catalog;

COMMIT;
