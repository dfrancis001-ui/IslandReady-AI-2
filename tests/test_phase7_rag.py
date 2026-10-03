"""Phase 7 verification (stdlib only, needs Ollama embeddings + DATABASE_URL).

Requires: migrations 000-006 applied, Ollama on OLLAMA_HOST with
OLLAMA_EMBED_MODEL available. Cleans up ingested demo docs afterwards
(registry mirror rows stay; they are reference data).

Run:  python tests/test_phase7_rag.py
Covers: registry statuses, ingest gate (allowed/refused), chunking,
embeddings stored, attribution metadata, freshness classes, audit-log shape,
source removal, pending-permission rejection. Deterministic ranking/safety
checks live in islandready-app/scripts/rag-check.ts (no model needed).
"""
import json
import os
import subprocess
import sys

FAIL = []
DB = os.environ["DATABASE_URL"]
PY = sys.executable
INGEST = [PY, os.path.join("islandready-app", "scripts", "rag_ingest.py")]


def check(name, cond, extra=""):
    (print("PASS " + name) if cond else (FAIL.append(name), print("FAIL " + name, extra)))


def q(sql, args=()):
    import psycopg  # noqa: E402 (late import keeps helper import-light)

    conn = psycopg.connect(DB)
    rows = conn.execute(sql, args).fetchall()
    conn.close()
    return rows


def run_ingest(*args):
    env = dict(os.environ)
    return subprocess.run(INGEST + list(args), capture_output=True, text=True, env=env)


# 1. registry statuses: 10 demo-approved/allowed, 7 pending/refused
rows = q("SELECT registry_id, status, ingest_allowed FROM kb_sources")
allowed = sorted(r[0] for r in rows if r[2])
refused = sorted(r[0] for r in rows if not r[2])
check("10 demo-approved allowed",
      len(allowed) == 10 and all(a.startswith("IR-DEMO-") for a in allowed), allowed)
check("7 pending refused incl NEMO/CDEMA",
      len(refused) == 7 and "NEMO-TIPS-001" in refused and "CDEMA-HURR-001" in refused
      and "NEMO-SHELTER-OPS-01" in refused, refused)

# 2. ingest gate: pending + unknown refused without writes
r = run_ingest("--check", "NEMO-TIPS-001")
check("pending NEMO refused", r.returncode == 2 and "REFUSED" in r.stdout, r.stdout[-200:])
r = run_ingest("--check", "NOPE-999")
check("unknown ID refused", r.returncode == 2, r.returncode)
r = run_ingest("--check", "IR-DEMO-WATER-01")
check("demo ID allowed", r.returncode == 0 and "ALLOWED" in r.stdout, r.stdout[-200:])

# 3. ingest demo corpus
r = run_ingest("--all-approved")
check("ingest all-approved ok", r.returncode == 0, r.stdout[-300:] + r.stderr[-300:])
docs = q("SELECT id, registry_id, version, published_date FROM kb_documents")
check("10 demo docs stored", len(docs) == 10, len(docs))
chunks = q("SELECT COUNT(*) FROM kb_chunks")[0][0]
check("chunks created (>=10)", chunks >= 10, chunks)

# 4. embeddings stored (real vectors, uniform dims)
dims = q("SELECT jsonb_array_length(embedding) FROM kb_chunks LIMIT 1")[0][0]
check("embeddings present, dims>0", isinstance(dims, int) and dims > 0, dims)
null_emb = q("SELECT COUNT(*) FROM kb_chunks WHERE embedding IS NULL")[0][0]
check("no null embeddings", null_emb == 0, null_emb)

# 5. attribution metadata complete on every chunk's document
bad = q("SELECT COUNT(*) FROM kb_documents WHERE title='' OR publisher='' OR category=''")[0][0]
check("attribution complete", bad == 0, bad)
label = q("SELECT publisher FROM kb_documents LIMIT 1")[0][0]
check("demo label present, no official claims",
      "demonstration content" in label and "NEMO" not in label and "CDEMA" not in label, label)

# 6. freshness classes: 9 evergreen-ish (a) + 1 stale (b, 2023)
fresh = q("SELECT freshness_class, COUNT(*) FROM kb_documents GROUP BY 1")
fresh = {r[0]: r[1] for r in fresh}
stale = q("SELECT published_date FROM kb_documents WHERE registry_id='IR-DEMO-STALE-01'")[0][0]
check("freshness classes correct",
      fresh.get("a") == 9 and fresh.get("b") == 1 and str(stale) == "2023-06-01", (fresh, stale))

# 7. audit-log shape (minimized columns only)
cols = sorted(r[0] for r in q(
    "SELECT column_name FROM information_schema.columns WHERE table_name='kb_query_log'"))
check("audit log minimized columns",
      cols == ["chunk_ids", "created_at", "decision", "household_id", "id", "question"], cols)
conn_rows = q("INSERT INTO kb_query_log (household_id, question, chunk_ids, decision)"
              " VALUES (NULL, 'test q', '[]', 'no-evidence') RETURNING id")
check("audit write works", len(conn_rows) == 1, conn_rows)

# 8. source removal propagates (doc delete cascades chunks)
import psycopg  # noqa: E402

conn = psycopg.connect(DB)
conn.execute("DELETE FROM kb_documents WHERE registry_id='IR-DEMO-FLOOD-01'")
conn.execute("DELETE FROM kb_query_log WHERE question='test q'")
conn.commit()
left = conn.execute("SELECT COUNT(*) FROM kb_chunks c JOIN kb_documents d ON d.id=c.doc_id"
                     " WHERE d.registry_id='IR-DEMO-FLOOD-01'").fetchall()[0][0]
conn.close()
check("removed source leaves no chunks", left == 0, left)

# 9. cleanup ingested demo docs (registry mirror + NEMO/CDEMA metadata stay)
conn = psycopg.connect(DB)
conn.execute("DELETE FROM kb_documents WHERE registry_id LIKE 'IR-DEMO-%'")
conn.commit()
conn.close()
left = q("SELECT COUNT(*) FROM kb_documents")[0][0]
check("cleanup ok", left == 0, left)

print("\n%d failed" % len(FAIL))
raise SystemExit(1 if FAIL else 0)
