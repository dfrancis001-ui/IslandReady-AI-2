"""IslandReady AI — RAG ingest runner (Phase 7 tooling, not app code).

Reads db/seeds/006_demo_corpus.json, enforces the kb_sources ingest gate
(ingest_allowed must be TRUE — pending_permission IDs are REFUSED), chunks
text, embeds via Ollama, and stores documents + chunks.

Usage:
  python scripts/rag_ingest.py --registry-id IR-DEMO-WATER-01
  python scripts/rag_ingest.py --all-approved        (demo-approved IDs only)
  python scripts/rag_ingest.py --check ID             (gate check, no writes)

Requires: DATABASE_URL env, Ollama on OLLAMA_HOST with OLLAMA_EMBED_MODEL.
"""
import json
import os
import sys
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, REPO)
import psycopg  # noqa: E402

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")
EMBED_MODEL = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")


def embed(texts):
    out = []
    for t in texts:
        req = urllib.request.Request(
            OLLAMA_HOST + "/api/embeddings",
            data=json.dumps({"model": EMBED_MODEL, "prompt": t}).encode(),
            headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as r:
            body = json.loads(r.read().decode())
        if not isinstance(body.get("embedding"), list):
            raise RuntimeError("bad embedding response")
        out.append(body["embedding"])
    return out


def chunk(text, max_chars=800):
    parts, buf = [], ""
    for para in text.split("\n"):
        para = para.strip()
        if not para:
            continue
        if len(buf) + len(para) + 1 > max_chars and buf:
            parts.append(buf)
            buf = para
        else:
            buf = (buf + " " + para).strip() if buf else para
    if buf:
        parts.append(buf)
    return parts or [text]


def main():
    args = sys.argv[1:]
    corpus_path = os.path.join(REPO, "db", "seeds", "006_demo_corpus.json")
    with open(corpus_path, encoding="utf-8") as f:
        corpus = json.load(f)
    by_id = {d["registry_id"]: d for d in corpus["documents"]}

    conn = psycopg.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    if args[:1] == ["--check"]:
        rid = args[1]
        row = conn.execute(
            "SELECT ingest_allowed, status FROM kb_sources WHERE registry_id=%s",
            (rid,)).fetchone()
        print("gate:", rid, row)
        if not row or not row[0]:
            print("REFUSED: %s is not ingestible (pending or unknown)" % rid)
            raise SystemExit(2)
        print("ALLOWED")
        return

    if args[:1] == ["--all-approved"]:
        ids = [d for d in by_id]
    elif args[:1] == ["--registry-id"]:
        ids = [args[1]]
    else:
        print("usage: rag_ingest.py (--registry-id ID | --all-approved | --check ID)")
        raise SystemExit(2)

    for rid in ids:
        row = conn.execute(
            "SELECT ingest_allowed, status, title FROM kb_sources WHERE registry_id=%s",
            (rid,)).fetchone()
        if not row or not row[0]:
            print("REFUSED: %s is not ingestible (status=%s)" %
                  (rid, row[1] if row else "unknown"))
            raise SystemExit(2)
        doc = by_id[rid]
        doc_id = "%s-v%d" % (rid, doc["version"])
        chunks = chunk(doc["text"])
        vecs = embed(chunks)
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO kb_documents (id, registry_id, title, publisher, category,"
                " freshness_class, version, published_date) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)"
                " ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,"
                " publisher=EXCLUDED.publisher, category=EXCLUDED.category,"
                " freshness_class=EXCLUDED.freshness_class, version=EXCLUDED.version,"
                " published_date=EXCLUDED.published_date",
                (doc_id, rid, doc["title"], doc["publisher"], doc["category"],
                 doc["freshness_class"], doc["version"], doc["published_date"]))
            cur.execute("DELETE FROM kb_chunks WHERE doc_id=%s", (doc_id,))
            for pos, (text, vec) in enumerate(zip(chunks, vecs)):
                cur.execute(
                    "INSERT INTO kb_chunks (doc_id, position, text, embedding, category)"
                    " VALUES (%s,%s,%s,%s,%s)",
                    (doc_id, pos, text, json.dumps(vec), doc["category"]))
        print("ingested %s: %d chunks" % (doc_id, len(chunks)))
    conn.close()


if __name__ == "__main__":
    main()
