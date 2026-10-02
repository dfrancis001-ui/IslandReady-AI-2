"""Phase 4 scoring parity (stdlib only).

Proves the TypeScript mirror (src/lib/scoring.ts, served via
/api/households/[id]/score) returns results identical to the authoritative
Python engine (engine/readiness_v1.py) for shared fixtures, reading weights
from PostgreSQL in both paths... (engine uses its constants, API uses DB rows).

Requires: dev server on :3000 with DATABASE_URL, migrations 000-003 applied.
Cleans up its test user/households. Also proves toggle -> DB -> refreshed score.

Run:  python tests/test_phase4_parity.py
"""
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "engine"))
import readiness_v1 as engine

BASE = "http://localhost:3000"
FAIL = []


def api(method, path, body=None, cookie=""):
    data = headers = None
    if body is not None:
        data = json.dumps(body).encode()
        headers = {"Content-Type": "application/json"}
    if cookie:
        headers = dict(headers or {})
        headers["Cookie"] = cookie
    r = urllib.request.Request(BASE + path, data=data, headers=headers or {},
                               method=method)
    try:
        resp = urllib.request.urlopen(r)
        return resp.status, json.loads(resp.read().decode() or "{}"), ""
    except urllib.error.HTTPError as e:
        return e.code, {}, ""


import urllib.error  # noqa: E402
import urllib.parse  # noqa: E402
from http.cookiejar import CookieJar  # noqa: E402

ALL = [i["key"] for i in engine.ITEMS]
E, P = "phase4.parity@example.org", "S3cure-Pass-123"


def login(email, password):
    jar = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

    class NoRed(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None

    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar), NoRed())
    csrf = json.loads(opener.open(BASE + "/api/auth/csrf").read().decode())["csrfToken"]
    try:
        opener.open(urllib.request.Request(
            BASE + "/api/auth/callback/credentials",
            data=urllib.parse.urlencode(
                {"csrfToken": csrf, "email": email, "password": password}).encode(),
            method="POST"))
    except urllib.error.HTTPError:
        pass
    cookie = "; ".join("%s=%s" % (c.name, c.value) for c in jar)
    assert "session-token" in cookie, "login failed for %s" % email
    return cookie


def expand(spec):
    if "all" in spec:
        return list(ALL)
    if "all_except" in spec:
        skip = set(spec[spec.index("all_except") + 1:])
        return [k for k in ALL if k not in skip]
    return list(spec)


def set_state(cookie, hid, done):
    want = set(done)
    for key in ALL:
        s, _, _ = api("POST", "/api/households/%s/checklist" % hid,
                      {"item": key, "done": key in want}, cookie)
        assert s == 200, (key, s)


with open(os.path.join(os.path.dirname(__file__), "fixtures.json"),
          encoding="utf-8") as f:
    FIX = json.load(f)["fixtures"]

api("POST", "/api/auth/signup", {"email": E, "password": P, "community": "Vieux Fort"})
cookie = login(E, P)
s, b, _ = api("GET", "/api/households", None, cookie)
hid = b["households"][0]["id"]
HH = {"members": {"adults": 2, "children": 2, "baby": True, "elderly": True,
                  "mobility_needs": False, "pets": False}}

CASES = {
    "F0_empty": ("expect_score", 0), "F1_half": ("expect_score", 52),
    "F2_proto78": ("expect_score", 78), "F3_full": ("expect_score", 100),
    "F6_water_gap": ("expect_score", 86), "F5_comms_gap": ("expect_score", 80),
}
for name, (_, want_score) in CASES.items():
    done = expand(FIX[name]["done"])
    set_state(cookie, hid, done)
    s, b, _ = api("GET", "/api/households/%s/score" % hid, None, cookie)
    exp_actions = engine.next_best_actions(done, HH)
    ok = (s == 200 and b["score"] == want_score == engine.score(done)
          and b["biggestGap"] == engine.biggest_gap(done)
          and b["subScores"] == engine.sub_scores(done)
          and b["total"] == 12
          and [a["category"] for a in b["actions"]] ==
          [a["category"] for a in exp_actions]
          and [a["title"] for a in b["actions"]] ==
          [a["title"] for a in exp_actions])
    (print("PASS " + name) if ok else (FAIL.append(name), print("FAIL " + name, b)))

# toggle -> DB -> refreshed score
set_state(cookie, hid, expand(FIX["F4_five"]["done"]))
s, b1, _ = api("GET", "/api/households/%s/score" % hid, None, cookie)
s, _, _ = api("POST", "/api/households/%s/checklist" % hid,
              {"item": "first_aid_meds", "done": True}, cookie)
s, b2, _ = api("GET", "/api/households/%s/score" % hid, None, cookie)
ok = b1["score"] == 44 and b2["score"] == 56 and b2["score"] > b1["score"]
(print("PASS toggle-refresh") if ok
 else (FAIL.append("toggle-refresh"), print("FAIL toggle-refresh", b1["score"], b2["score"])))

# cleanup
import psycopg  # noqa: E402
conn = psycopg.connect(os.environ["DATABASE_URL"])
conn.execute("DELETE FROM users WHERE email=%s", (E,))
conn.execute("DELETE FROM households WHERE id=%s", (hid,))
conn.commit()
conn.close()
print("cleanup done\n%d failed" % len(FAIL))
sys.exit(1 if FAIL else 0)
