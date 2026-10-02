-- IslandReady AI — rollback for db/migrations/003_users_auth.sql (Phase 1).
-- Drops only objects created by 003, in dependency-safe order
-- (memberships before users). Safe for the development database.
-- Run (only after approval): psql $DATABASE_URL -f down/003_users_auth.down.sql

BEGIN;

DROP TABLE IF EXISTS household_memberships;
DROP TABLE IF EXISTS users;

COMMIT;
