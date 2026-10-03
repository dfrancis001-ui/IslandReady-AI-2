-- IslandReady AI — rollback for db/migrations/006_kb.sql (Phase 7).
-- Drops only objects created by 006, in dependency-safe order.
-- Safe for the development database.
-- Run (only after approval): psql $DATABASE_URL -f down/006_kb.down.sql

BEGIN;

DROP TABLE IF EXISTS kb_query_log;
DROP TABLE IF EXISTS kb_chunks;
DROP TABLE IF EXISTS kb_documents;
DROP TABLE IF EXISTS kb_sources;

COMMIT;
