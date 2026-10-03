-- IslandReady AI — rollback for db/migrations/007_recovery.sql (Phase 10).
-- Drops only objects created by 007, in dependency-safe order.
-- NOTE: orphan photo binaries on the filesystem (if any) must be removed by
-- the application delete path, not by this script. Safe for development use.
-- Run (only after approval): psql $DATABASE_URL -f down/007_recovery.down.sql

BEGIN;

DROP TABLE IF EXISTS recovery_photos;
DROP TABLE IF EXISTS recovery_tasks;
DROP TABLE IF EXISTS recovery_records;

COMMIT;
