"""IslandReady AI checklist persistence — Phase 3, Task 5.

Reads/writes per-household checklist state in PostgreSQL.
Requires Phase 2 `households(id)` and Phase 3 migration 001 applied.
Connection: DATABASE_URL env var (local only, never committed).

Schema reminder:
  household_checklist_state(household_id TEXT FK -> households(id),
                            item_key TEXT FK -> checklist_items(key),
                            done BOOLEAN, updated_at TIMESTAMPTZ,
                            PRIMARY KEY (household_id, item_key))
"""
import os

import psycopg


def connect():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set (local .env only, never commit it).")
    return psycopg.connect(url)


def get_done_items(conn, household_id):
    """Return the set of done item keys for a household."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT item_key FROM household_checklist_state "
            "WHERE household_id = %s AND done = TRUE",
            (household_id,),
        )
        return {row[0] for row in cur.fetchall()}


def set_item(conn, household_id, item_key, done):
    """Upsert one checklist item's state. Raises on unknown household/item via FK."""
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO household_checklist_state (household_id, item_key, done, updated_at) "
            "VALUES (%s, %s, %s, now()) "
            "ON CONFLICT (household_id, item_key) "
            "DO UPDATE SET done = EXCLUDED.done, updated_at = now()",
            (household_id, item_key, bool(done)),
        )
    conn.commit()
