"""Purge kb_query_log rows older than 30 days (Phase 12 retention enforcement).

Safe to run repeatedly (idempotent date predicate). Reports the removed count
and never touches newer rows. Operate manually for local dev; schedule via the
platform scheduler in production.

Usage:  python islandready-app/scripts/purge-query-log.py [--days N]
Requires: DATABASE_URL env (local .env only).
"""
import os
import sys

import psycopg

DAYS = 30
if len(sys.argv) == 3 and sys.argv[1] == "--days":
    try:
        DAYS = int(sys.argv[2])
        assert DAYS > 0
    except (ValueError, AssertionError):
        print("days must be a positive integer")
        raise SystemExit(2)
elif len(sys.argv) != 1:
    print("usage: purge-query-log.py [--days N]")
    raise SystemExit(2)

url = os.environ.get("DATABASE_URL")
if not url:
    print("DATABASE_URL is not set (local .env only, never commit it).")
    raise SystemExit(2)

conn = psycopg.connect(url)
n = conn.execute(
    "DELETE FROM kb_query_log WHERE created_at < now() - make_interval(days => %s)",
    (DAYS,),
).rowcount
conn.commit()
conn.close()
print("purged %d kb_query_log row(s) older than %d days." % (n, DAYS))
