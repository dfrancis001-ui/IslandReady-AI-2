-- IslandReady AI — Phase 7 migration: RAG knowledge-base tables.
-- Version: 1. Stores registry mirror, documents, chunks (JSONB embeddings),
-- and minimized query audit log. No pgvector dependency (app-side cosine).
-- Run (only after review): psql $DATABASE_URL -f 006_kb.sql
--
-- kb_sources mirrors docs/kb_sources.md statuses: ingest_allowed=false rows
-- hold METADATA ONLY (no external text) for pending_permission candidates.
-- Rollback: db/migrations/down/006_kb.down.sql

BEGIN;

CREATE TABLE IF NOT EXISTS kb_sources (
  registry_id    TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  publisher      TEXT NOT NULL,
  url            TEXT NOT NULL DEFAULT '',
  freshness_class TEXT NOT NULL CHECK (freshness_class IN ('a', 'b', 'c', 'x')),
  status         TEXT NOT NULL CHECK (status IN ('demo-approved', 'pending_permission', 'approved', 'retired', 'excluded')),
  ingest_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  reason         TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS kb_documents (
  id              TEXT PRIMARY KEY,
  registry_id     TEXT NOT NULL REFERENCES kb_sources(registry_id),
  title           TEXT NOT NULL,
  publisher       TEXT NOT NULL,
  category        TEXT NOT NULL,
  freshness_class TEXT NOT NULL CHECK (freshness_class IN ('a', 'b', 'c')),
  version         INTEGER NOT NULL DEFAULT 1,
  published_date  DATE,
  retrieved_date  DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS kb_chunks (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doc_id      TEXT NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  text        TEXT NOT NULL,
  embedding   JSONB,
  category    TEXT NOT NULL DEFAULT ''
);

-- Minimized audit log: NO household context beyond the id, NO member details,
-- NO family-plan contents. Retention: 30 days (see docs/rag_architecture.md).
CREATE TABLE IF NOT EXISTS kb_query_log (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id TEXT REFERENCES households(id) ON DELETE SET NULL,
  question   TEXT NOT NULL,
  chunk_ids  JSONB NOT NULL DEFAULT '[]',
  decision   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registry mirror seed: demo-approved entries ingestible; NEMO/CDEMA candidates
-- recorded as pending_permission with ingest_allowed=false (metadata only).
INSERT INTO kb_sources (registry_id, title, publisher, url, freshness_class, status, ingest_allowed, reason) VALUES
  ('IR-DEMO-HOME-01',   'Demo: preparing a home for hurricane winds', 'IslandReady AI (demonstration content)', '', 'a', 'demo-approved', TRUE, 'Demo corpus: hurricane home prep'),
  ('IR-DEMO-WATER-01',  'Demo: storing drinking water', 'IslandReady AI (demonstration content)', '', 'a', 'demo-approved', TRUE, 'Demo corpus: water storage'),
  ('IR-DEMO-FOOD-01',   'Demo: storing emergency food including baby food', 'IslandReady AI (demonstration content)', '', 'a', 'demo-approved', TRUE, 'Demo corpus: food storage'),
  ('IR-DEMO-COMMS-01',  'Demo: radio, phone tree, and out-of-island contact', 'IslandReady AI (demonstration content)', '', 'a', 'demo-approved', TRUE, 'Demo corpus: comms planning'),
  ('IR-DEMO-SHELTER-01','Demo: general shelter-packing list', 'IslandReady AI (demonstration content)', '', 'a', 'demo-approved', TRUE, 'Demo corpus: shelter packing (no specific shelter)'),
  ('IR-DEMO-RIGHTNOW-01','Demo: hypothetical right-now response pattern', 'IslandReady AI (demonstration content)', '', 'a', 'demo-approved', TRUE, 'Demo corpus: hypothetical pattern, never live evidence'),
  ('IR-DEMO-FLOOD-01',  'Demo: drains, gutters, and flood preparation', 'IslandReady AI (demonstration content)', '', 'a', 'demo-approved', TRUE, 'Demo corpus: flood prep'),
  ('IR-DEMO-AFTER-01',  'Demo: general steps after a storm passes', 'IslandReady AI (demonstration content)', '', 'a', 'demo-approved', TRUE, 'Demo corpus: post-storm steps'),
  ('IR-DEMO-STALE-01',  'Demo: superseded seasonal guidance (v1, 2023)', 'IslandReady AI (demonstration content)', '', 'b', 'demo-approved', TRUE, 'Demo corpus: date-awareness fixture'),
  ('IR-DEMO-INJECT-01', 'Demo: adversarial fixture with embedded instruction', 'IslandReady AI (demonstration content)', '', 'a', 'demo-approved', TRUE, 'Demo corpus: injection fixture (data, never instructions)'),
  ('NEMO-TIPS-001',   'NEMO To Do Checklist + downloads', 'NEMO Saint Lucia', 'https://nemo.gov.lc/Tips/To-Do-Checklist', 'b', 'pending_permission', FALSE, 'Reuse terms unconfirmed; Terms review required'),
  ('NEMO-HAZ-001',    'NEMO Hazard Information', 'NEMO Saint Lucia', 'https://nemo.gov.lc/Disaster-Management/Hazards/Hazard-Information', 'b', 'pending_permission', FALSE, 'Reuse terms unconfirmed'),
  ('NEMO-NEMP-001',   'NEMO National Emergency Management Plan materials', 'NEMO Saint Lucia', 'https://nemo.gov.lc/Disaster-Management/National-Emergency-Management-Plan/General-Info', 'b', 'pending_permission', FALSE, 'Reuse terms unconfirmed; individual docs unopened'),
  ('NEMO-REC-001',    'NEMO Recovery Info + Relief & Aid', 'NEMO Saint Lucia', 'https://nemo.gov.lc/Disaster-Management/Recovery-Info', 'b', 'pending_permission', FALSE, 'Reuse terms unconfirmed; Recovery Info page empty'),
  ('NEMO-SHELTER-OPS-01', 'NEMO Shelter Listing (operational)', 'NEMO Saint Lucia', 'https://nemo.gov.lc/Shelter-Listing', 'c', 'pending_permission', FALSE, 'Class c: never safety evidence; refusal routing only'),
  ('CDEMA-HURR-001',  'CDEMA Hurricane Season preparedness', 'CDEMA', 'https://www.cdema.org/index.php/hurricane-season', 'b', 'pending_permission', FALSE, 'Reuse terms unconfirmed'),
  ('CDEMA-CDM-001',   'CDEMA CDM concept pages', 'CDEMA', 'https://cdema.org/index.php/cdm', 'b', 'pending_permission', FALSE, 'No household guidance confirmed; likely excluded')
ON CONFLICT (registry_id) DO UPDATE SET
  title = EXCLUDED.title, publisher = EXCLUDED.publisher, url = EXCLUDED.url,
  freshness_class = EXCLUDED.freshness_class, status = EXCLUDED.status,
  ingest_allowed = EXCLUDED.ingest_allowed, reason = EXCLUDED.reason;

COMMIT;
