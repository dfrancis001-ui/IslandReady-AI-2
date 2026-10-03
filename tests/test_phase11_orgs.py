"""Phase 11 verification (stdlib only).

Requires: dev server on :3000 with DATABASE_URL, migrations 000-008 applied.
Cleans up its test users/orgs (cascades memberships, checklist state, audit rows).
promote-admin.py is exercised as a subprocess (refusal + success paths).

Run:  python tests/test_phase11_orgs.py
Covers: org creation + owner membership, member permissions (rename 403),
isolation (404s), anon 401s, checklist persistence/isolation, platform-admin
gate (403 + audit row), aggregate suppression (n<5) and availability (n>=5),
no-PII response shape, experimental roll-up math.
"""
import json
import os
import subprocess
import urllib.parse
import urllib.request
from http.cookiejar import CookieJar

BASE = 'http://localhost:3000'
FAIL = []


def check(name, cond, extra=''):
    (print('PASS ' + name) if cond else (FAIL.append(name), print('FAIL ' + name, extra)))


class NR(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def api(jar, method, path, json_body=None):
    data = headers = None
    if json_body is not None:
        data = json.dumps(json_body).encode()
        headers = {'Content-Type': 'application/json'}
    r = urllib.request.Request(BASE + path, data=data, headers=headers or {},
                               method=method)
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    try:
        resp = opener.open(r)
        return resp.status, json.loads(resp.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or '{}')
        except Exception:
            return e.code, {}


import urllib.error  # noqa: E402
import psycopg as _pg  # noqa: E402 (pre-cleanup only; main import below reuses)


def _preclean():
    conn = _pg.connect(os.environ['DATABASE_URL'])
    conn.execute('DELETE FROM users WHERE email LIKE %s', ('phase11.%@example.org',))
    conn.execute('DELETE FROM households WHERE id NOT IN (SELECT household_id FROM household_memberships)')
    conn.execute('DELETE FROM organizations WHERE id NOT IN (SELECT organization_id FROM organization_memberships)')
    conn.execute("DELETE FROM audit_log WHERE action='institutional-metrics'")
    conn.commit()
    conn.close()


_preclean()


def signup_login(email, password):
    jar = CookieJar()
    s, _ = api(jar, 'POST', '/api/auth/signup',
               {'email': email, 'password': password, 'community': 'Castries'})
    assert s in (200, 201), s
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    csrf = json.loads(op.open(BASE + '/api/auth/csrf').read().decode())['csrfToken']
    op2 = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar), NR())
    try:
        op2.open(urllib.request.Request(
            BASE + '/api/auth/callback/credentials',
            data=urllib.parse.urlencode(
                {'csrfToken': csrf, 'email': email,
                 'password': password}).encode(),
            method='POST'))
    except urllib.error.HTTPError:
        pass
    return jar


jar1 = signup_login('phase11.owner@example.org', 'S3cure-Pass-123')
jar2 = signup_login('phase11.member@example.org', 'S3cure-Pass-123')
jar3 = signup_login('phase11.stranger@example.org', 'S3cure-Pass-123')

# 1. create org -> owner membership
s, b = api(jar1, 'POST', '/api/orgs', {'name': 'Test Church', 'kind': 'church'})
check('create org 201 + owner', s == 201 and 'id' in b, (s, b))
oid = b.get('id', '')
s, b = api(jar1, 'POST', '/api/orgs', {'name': 'Bad', 'kind': 'army'})
check('bad kind -> 400', s == 400, s)
s, b = api(jar1, 'GET', '/api/orgs')
check('owner lists org with role',
      s == 200 and any(o['id'] == oid and o['role'] == 'owner' for o in b['orgs']), (s, b))

# add member directly (no invite flow in stub) for permission tests
import psycopg  # noqa: E402

conn = psycopg.connect(os.environ['DATABASE_URL'])
mid = conn.execute("SELECT id FROM users WHERE email='phase11.member@example.org'").fetchall()[0][0]
conn.execute("INSERT INTO organization_memberships (user_id, organization_id, role)"
             " VALUES (%s,%s,'member')", (mid, oid))
conn.commit()
conn.close()

# 2. owner/member permissions
s, _ = api(jar1, 'PUT', '/api/orgs/%s' % oid, {'name': 'Test Church Renamed'})
check('owner rename 200', s == 200, s)
s, _ = api(jar2, 'PUT', '/api/orgs/%s' % oid, {'name': 'Hijacked'})
check('member rename -> 403', s == 403, s)
s, b = api(jar1, 'GET', '/api/orgs/%s' % oid)
check('rename persisted, not hijacked',
      b.get('org', {}).get('name') == 'Test Church Renamed', b)

# 3. isolation + anon
s, _ = api(jar3, 'GET', '/api/orgs/%s' % oid)
check('non-member org -> 404', s == 404, s)
s, _ = api(jar3, 'GET', '/api/orgs/%s/checks' % oid)
check('non-member checks -> 404', s == 404, s)
s, _ = api(CookieJar(), 'GET', '/api/orgs')
check('anon orgs -> 401', s == 401, s)
s, _ = api(CookieJar(), 'GET', '/api/institutional/metrics')
check('anon metrics -> 401', s == 401, s)

# 4. checklist persistence + isolation
s, _ = api(jar2, 'POST', '/api/orgs/%s/checks' % oid, {'item': 'org_roles', 'done': True})
check('member toggles check 200', s == 200, s)
s, b = api(jar1, 'GET', '/api/orgs/%s/checks' % oid)
got = {c['item']: c['done'] for c in b.get('checks', [])}
check('toggle persists, 5 items listed',
      got.get('org_roles') is True and len(got) == 5, got)
s, _ = api(jar2, 'POST', '/api/orgs/%s/checks' % oid, {'item': 'nope', 'done': True})
check('unknown item -> 400', s == 400, s)

# 5. experimental roll-up math (1/5 done = 20%)
s, b = api(jar1, 'GET', '/api/orgs/%s/rollup' % oid)
check('roll-up experimental 20%',
      s == 200 and b.get('percent') == 20 and b.get('experimental') is True
      and 'continuity-checklist' in b.get('measures', '').lower(), (s, b))

# 6. platform-admin gate + audit
s, _ = api(jar1, 'GET', '/api/institutional/metrics')
check('non-admin metrics -> 403', s == 403, s)
env = dict(os.environ)
r = subprocess.run(['python', 'islandready-app/scripts/promote-admin.py'],
                   capture_output=True, text=True, env=env)
check('promote-admin refuses without email', r.returncode == 2, r.returncode)
r = subprocess.run(['python', 'islandready-app/scripts/promote-admin.py',
                    'phase11.nonexistent@example.org'],
                   capture_output=True, text=True, env=env)
check('promote-admin refuses unknown user', r.returncode == 1 and 'refused' in r.stdout, r.stdout)
r = subprocess.run(['python', 'islandready-app/scripts/promote-admin.py',
                    'phase11.owner@example.org'],
                   capture_output=True, text=True, env=env)
check('promote-admin promotes existing user', r.returncode == 0, r.stdout)
s, b = api(jar1, 'GET', '/api/institutional/metrics')
check('admin metrics 200, suppressed at n<5',
      s == 200 and b.get('suppressed') is True and b.get('averageReadiness') is None
      and b.get('completedContinuityPlans', 0) >= 0, (s, b))
conn = psycopg.connect(os.environ['DATABASE_URL'])
n = conn.execute("SELECT COUNT(*) FROM audit_log WHERE action='institutional-metrics'").fetchall()[0][0]
conn.close()
check('institutional access audited', n >= 1, n)

# 7. no PII in institutional response: exact key allowlist + content scan
allowed = {'completedContinuityPlans', 'averageReadiness', 'contributingHouseholds',
           'suppressed', 'note'}
blob = json.dumps(b).lower()
pii = [w for w in ['@example.org', 'household_id', '"id": "hh-', '"email"',
                   'mom', 'gran', 'baby', 'meeting', 'photo', 'plan:', 'checklist']
       if w in blob]
check('no household PII in metrics',
      set(b.keys()) == allowed and pii == [], (sorted(b.keys()), pii))

# 8. availability at n>=5: create 4 more households with checklist state
extra = []
for i in range(4):
    j = signup_login('phase11.extra%d@example.org' % i, 'S3cure-Pass-123')
    s, h = api(j, 'GET', '/api/households')
    hid = h['households'][0]['id']
    api(j, 'POST', '/api/households/%s/checklist' % hid,
        {'item': 'store_water', 'done': True})
    extra.append((j, hid))
s, b = api(jar1, 'GET', '/api/institutional/metrics')
check('average available at n>=5',
      s == 200 and b.get('suppressed') is False
      and isinstance(b.get('averageReadiness'), (int, float))
      and b.get('contributingHouseholds', 0) >= 5, (s, b))

# cleanup
conn = psycopg.connect(os.environ['DATABASE_URL'])
hids = [r[0] for r in conn.execute(
    "SELECT h.id FROM households h JOIN household_memberships m ON m.household_id=h.id"
    " JOIN users u ON u.id=m.user_id WHERE u.email LIKE %s",
    ('phase11.%@example.org',)).fetchall()]
conn.execute('DELETE FROM users WHERE email LIKE %s', ('phase11.%@example.org',))
for hid in hids:
    conn.execute('DELETE FROM households WHERE id=%s', (hid,))
conn.execute('DELETE FROM organizations WHERE id=%s', (oid,))
conn.execute("DELETE FROM audit_log WHERE action='institutional-metrics'")
conn.commit()
conn.close()
print('cleanup done\n%d failed' % len(FAIL))
raise SystemExit(1 if FAIL else 0)
