"""Phase 3 live-PostgreSQL verification (Task 5). NOT part of the unit suite.

Requires: local PostgreSQL running, Phase 2 `households` table present,
001_readiness.sql + 002 seed applied, DATABASE_URL set in the environment.

Run:  python tests/verify_postgres.py            (uses DATABASE_URL)
      python tests/verify_postgres.py --embedded  (spins up embedded PostgreSQL;
        creates a TEST-ONLY minimal households(id) stand-in because the real
        Phase 2 table does not exist yet in this project)
Checks: migration applies, seed loads 10 categories / 12 items, checklist
state round-trips per household, score computed from DB state matches the
engine, and household isolation holds (FK rejects unknown households).
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "engine"))
import readiness_v1 as r
import store

HOUSEHOLD = "verify-household-1"
REPO = os.path.join(os.path.dirname(__file__), "..")


def apply_sql(conn, relpath):
    with open(os.path.join(REPO, relpath), encoding="utf-8") as f:
        conn.execute(f.read())


def main():
    pg = None
    if "--embedded" in sys.argv:
        import pgserver
        pg = pgserver.get_server(os.path.join(REPO, ".pgdata-test"))
        os.environ["DATABASE_URL"] = pg.get_uri()
        conn = store.connect()
        conn.autocommit = True
        # TEST-ONLY stand-in: the real Phase 2 households table does not exist
        # in this project yet. This exercises the FK mechanics in isolation and
        # must be replaced by the Phase 2 schema when it lands.
        conn.execute("CREATE TABLE IF NOT EXISTS households (id TEXT PRIMARY KEY)")
        apply_sql(conn, os.path.join("db", "migrations", "001_readiness.sql"))
        apply_sql(conn, os.path.join("db", "seeds", "002_hurricane_flood_plan.sql"))
        print("embedded postgres up; TEST-ONLY households stand-in created; migration+seed applied")
    else:
        conn = store.connect()
        conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM readiness_categories")
        cats = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM checklist_items")
        items = cur.fetchone()[0]
    assert cats == 10, "expected 10 categories, got %s" % cats
    assert items == 12, "expected 12 items, got %s" % items
    print("seed ok: 10 categories, 12 items")

    try:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO households (id) VALUES (%s) ON CONFLICT DO NOTHING",
                        (HOUSEHOLD,))
    except Exception as exc:  # Phase 2 shape may differ; report, don't fake it
        raise SystemExit("households table unusable (need Phase 2 shape): %s" % exc)

    for key in ("store_water", "store_food", "secure_windows", "clear_drains", "protect_docs"):
        store.set_item(conn, HOUSEHOLD, key, True)
    done = store.get_done_items(conn, HOUSEHOLD)
    assert done == {"store_water", "store_food", "secure_windows", "clear_drains", "protect_docs"}, done
    assert r.score(done) == 44, r.score(done)
    print("round-trip ok: 5/12 persisted, engine score from DB state = 44")

    store.set_item(conn, HOUSEHOLD, "store_water", False)
    assert "store_water" not in store.get_done_items(conn, HOUSEHOLD)
    print("uncheck ok: state update persisted")

    try:
        store.set_item(conn, "no-such-household", "store_water", True)
    except Exception:
        conn.rollback()
        print("isolation ok: unknown household rejected by FK")
    else:
        raise SystemExit("FAIL: unknown household was accepted")

    with conn.cursor() as cur:
        cur.execute("DELETE FROM household_checklist_state WHERE household_id = %s", (HOUSEHOLD,))
    conn.close()
    if pg is not None:
        pg.cleanup()
    print("ALL POSTGRES CHECKS PASSED")


if __name__ == "__main__":
    main()
