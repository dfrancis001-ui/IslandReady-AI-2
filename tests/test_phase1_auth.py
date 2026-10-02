"""Phase 1 end-to-end verification (stdlib only).

Requires: Next.js dev server on http://localhost:3000 with DATABASE_URL set,
migrations 000-003 applied. Cleans up its own test users/households.

Run:  python tests/test_phase1_auth.py
Covers: signup, login ok/fail, session persistence, authenticated access,
cross-household denial (404), invalid input, bcrypt hashing, scoring unchanged.
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from http.cookiejar import CookieJar

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "engine"))
import readiness_v1 as engine

BASE = "http://localhost:3000"
PASS = []
FAIL = []


def check(name, cond, extra=""):
    (PASS if cond else FAIL).append(name)
    print(("PASS " if cond else "FAIL ") + name + (" | " + str(extra) if extra and not cond else ""))


def req(jar, method, path, body=None, headers=None):
    data = None
    h = dict(headers or {})
    if body is not None:
        data = urllib.parse.urlencode(body).encode()
        h["Content-Type"] = "application/x-www-form-urlencoded"
    r = urllib.request.Request(BASE + path, data=data, headers=h, method=method)
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(jar),
        NoRedirect(),
    )
    try:
        resp = opener.open(r)
        return resp.status, resp.headers.get("Location", ""), resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Location", ""), e.read().decode()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def api(jar, method, path, json_body=None):
    data = headers = None
    if json_body is not None:
        data = json.dumps(json_body).encode()
        headers = {"Content-Type": "application/json"}
    r = urllib.request.Request(BASE + path, data=data, headers=headers or {}, method=method)
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    try:
        resp = opener.open(r)
        return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except Exception:
            return e.code, {}


import urllib.error  # noqa: E402  (kept late to keep helpers readable)

jar1, jar2, jar_anon = CookieJar(), CookieJar(), CookieJar()
E1, P1 = "phase1.t1@example.org", "S3cure-Pass-123"
E2, P2 = "phase1.t2@example.org", "S3cure-Pass-123"

# 1. signup
s, b = api(jar1, "POST", "/api/auth/signup",
           {"email": E1, "password": P1, "community": "Castries"})
check("signup 201 {ok:true}", s == 201 and b.get("ok") is True, (s, b))
# 2. duplicate signup: same shape, no leak
s, b = api(jar1, "POST", "/api/auth/signup", {"email": E1, "password": P1})
check("duplicate signup same-shape 200", s == 200 and b.get("ok") is True
      and "userId" not in b and "email" not in str(b).lower(), (s, b))
# 3. invalid signup input
s, _ = api(jar1, "POST", "/api/auth/signup", {"email": "bad", "password": P1})
check("bad email -> 400", s == 400, s)
s, _ = api(jar1, "POST", "/api/auth/signup", {"email": E2, "password": "short"})
check("short password -> 400", s == 400, s)

# 4. login ok (csrf dance)
_, _, csrf_body = req(jar1, "GET", "/api/auth/csrf")
token = json.loads(csrf_body)["csrfToken"]
s, loc, _ = req(jar1, "POST", "/api/auth/callback/credentials",
                {"csrfToken": token, "email": E1, "password": P1})
check("login ok redirects without error", s == 302 and "error" not in loc, (s, loc))
has_session = any(c.name.startswith("__Secure-next-auth.session-token")
                  or c.name == "next-auth.session-token" for c in jar1)
check("session cookie set", has_session)

# 5. failed login: same flow, wrong password -> error redirect, no session
_, _, csrf_body = req(jar2, "GET", "/api/auth/csrf")
token = json.loads(csrf_body)["csrfToken"]
s, loc, _ = req(jar2, "POST", "/api/auth/callback/credentials",
                {"csrfToken": token, "email": E1, "password": "wrong-pass-xyz"})
check("failed login -> error, no session",
      s == 302 and "error" in loc
      and not any("session-token" in c.name for c in jar2), (s, loc))

# 6. session persistence + household access
s, b = api(jar1, "GET", "/api/households")
hh = (b.get("households") or [])
check("authenticated list 200 + 1 owner household",
      s == 200 and len(hh) == 1 and hh[0]["role"] == "owner", (s, b))
hid = hh[0]["id"] if hh else ""
s, b = api(jar_anon, "GET", "/api/households")
check("anonymous list -> 401", s == 401, s)
s, b = api(jar1, "GET", "/api/households/%s/checklist" % hid)
check("own checklist readable (empty)", s == 200 and b.get("state") == [], (s, b))

# 7. cross-household denial
s, _ = api(jar2, "POST", "/api/auth/signup", {"email": E2, "password": P2})
s, b = api(jar2, "GET", "/api/households")
# login user2
_, _, csrf_body = req(jar2, "GET", "/api/auth/csrf")
token = json.loads(csrf_body)["csrfToken"]
req(jar2, "POST", "/api/auth/callback/credentials",
    {"csrfToken": token, "email": E2, "password": P2})
s, b = api(jar2, "GET", "/api/households")
hid2 = (b.get("households") or [{}])[0].get("id", "")
s, _ = api(jar1, "GET", "/api/households/%s/checklist" % hid2)
check("cross-household read -> 404", s == 404, s)
s, _ = api(jar1, "POST", "/api/households/%s/checklist" % hid2,
           {"item": "store_water", "done": True})
check("cross-household write -> 404", s == 404, s)

# 8. invalid checklist input + unknown item
s, _ = api(jar1, "POST", "/api/households/%s/checklist" % hid, {"item": "x"})
check("bad body -> 400", s == 400, s)
s, _ = api(jar1, "POST", "/api/households/%s/checklist" % hid,
           {"item": "drop_table", "done": True})
check("unknown item -> 400", s == 400, s)

# 9. password hashing (read-only DB peek)
import psycopg  # noqa: E402
conn = psycopg.connect(os.environ["DATABASE_URL"])
row = conn.execute("SELECT password_hash FROM users WHERE email=%s",
                   (E1,)).fetchone()
conn.close()
check("bcrypt hash stored, not plaintext",
      row and row[0].startswith("$2b$12$") and P1 not in row[0])

# 10. scoring unchanged end-to-end: set 5 items via API, engine scores 44
for item in ["store_water", "store_food", "secure_windows", "clear_drains", "protect_docs"]:
    s, _ = api(jar1, "POST", "/api/households/%s/checklist" % hid,
               {"item": item, "done": True})
    assert s == 200, (item, s)
s, b = api(jar1, "GET", "/api/households/%s/checklist" % hid)
done = {r["item"] for r in b["state"] if r["done"]}
check("engine scores API state at 44", engine.score(done) == 44, engine.score(done))

# cleanup own test rows (users cascade to memberships + checklist state)
conn = psycopg.connect(os.environ["DATABASE_URL"])
conn.execute("DELETE FROM users WHERE email IN (%s,%s)", (E1, E2))
conn.execute("DELETE FROM households WHERE id IN (%s,%s)", (hid, hid2))
conn.commit()
conn.close()
print("cleanup done")

print("\n%d passed, %d failed" % (len(PASS), len(FAIL)))
sys.exit(1 if FAIL else 0)
