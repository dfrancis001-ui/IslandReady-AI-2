"""Promote an existing local user to platform-admin (Phase 11).

LOCAL DEVELOPMENT ONLY. Never seed privileged accounts, never commit
credentials, never run against production. Fails closed: unknown or missing
email changes nothing.

Usage:  python islandready-app/scripts/promote-admin.py user@example.org
Requires: DATABASE_URL env (local .env only).
"""
import os
import sys

import psycopg


def main() -> int:
    if len(sys.argv) != 2 or not sys.argv[1] or "@" not in sys.argv[1]:
        print("usage: promote-admin.py <existing-user-email>")
        return 2
    email = sys.argv[1].strip().lower()
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("DATABASE_URL is not set (local .env only, never commit it).")
        return 2
    conn = psycopg.connect(url)
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        row = cur.fetchone()
        if not row:
            print("refused: no such local user (%s); nothing changed." % email)
            return 1
        cur.execute("UPDATE users SET is_platform_admin = TRUE WHERE email = %s", (email,))
    conn.commit()
    conn.close()
    print("promoted %s to platform-admin (local dev only)." % email)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
