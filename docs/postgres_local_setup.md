# Local PostgreSQL setup — STATUS: BLOCKED (no administrator access)

The project database is **PostgreSQL** (unchanged — no substitute database).
A persistent local server cannot be installed yet because Windows requires an
administrator password that the owner does not have. No admin bypass has been
attempted or will be attempted.

## What is ready now (no server required)

- `DATABASE_URL` format agreed: `postgresql://USER:PASSWORD@localhost:5432/islandready_dev`
  (see `.env.example` — placeholders only).
- Migration order agreed: Phase 2 `households` migration FIRST, then
  `db/migrations/001_readiness.sql` (it FK-references `households(id)`),
  then `db/seeds/002_hurricane_flood_plan.sql`.
- Connection check: `python tests/verify_postgres.py` (uses `DATABASE_URL`;
  `--embedded` mode is for engine verification only, never the project database).
- Engine DB layer: `engine/store.py` reads `DATABASE_URL` from a local-only `.env`.

## Steps for later, when administrator access is available

1. Owner installs PostgreSQL 18 via the attended EDB installer (GUI), records the
   superuser password privately (never in chat, never in a file).
2. Assistant (no admin needed after install): create role + dev database, e.g.
   `CREATE ROLE islandready LOGIN PASSWORD '<local-only>';`
   `CREATE DATABASE islandready_dev OWNER islandready;`
3. Owner creates local-only `.env` from `.env.example` with the real values
   (`.env` is git-ignored and never committed).
4. Assistant applies migrations in the agreed order and runs
   `python tests/verify_postgres.py` (DATABASE_URL mode) as proof.
5. Phase 2 household tables are built on that database; Phase 3 checklist state
   moves off the TEST-ONLY stand-in with no engine changes required.
