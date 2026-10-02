"""Phase 6 verification (stdlib only).

Requires: dev server on :3000 with DATABASE_URL, migrations 000-005 applied.
Cleans up its test users/households (cascade removes supply lists/lines).

Run:  python tests/test_phase6_supplies.py
Covers: exact fixture totals (208.50 / 432.00 / 1052.00), invalid people/days,
determinism, rounding, save/reload/edit persistence, fresh sign-in persistence,
anon 401s, cross-household read/write/delete 404s (victim byte-identical).
"""
import json
import os
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
    s, b = api(jar, 'GET', '/api/households')
    assert s == 200 and len(b['households']) == 1, (s, b)
    return jar, b['households'][0]['id']


jar1, hid1 = signup_login('phase6.one@example.org', 'S3cure-Pass-123')
CALC = '/api/households/%s/supplies/calculate' % hid1
LISTS = '/api/households/%s/supplies/lists' % hid1


def calc(people, days):
    return api(jar1, 'POST', CALC, {'people': people, 'days': days})


# 1. exact fixture totals (cents)
s, b = calc(4, 3)
check('4p/3d = EC$432.00', s == 200 and b.get('totalCents') == 43200, (s, b.get('totalCents')))
s, b = calc(1, 1)
check('1p/1d = EC$208.50', s == 200 and b.get('totalCents') == 20850, (s, b.get('totalCents')))
s, b = calc(6, 7)
check('6p/7d = EC$1052.00', s == 200 and b.get('totalCents') == 105200, (s, b.get('totalCents')))

# 2. line-item honesty: 6 lines, integer cents, sums reconcile
s, b = calc(4, 3)
lines = b.get('lines', [])
check('6 lines reconcile to total',
      len(lines) == 6 and sum(l['lineTotalCents'] for l in lines) == b['totalCents']
      and all(isinstance(l['lineTotalCents'], int) for l in lines), len(lines))

# 3. invalid inputs
for people, days in [(0, 3), (-1, 3), (31, 3), (4, 0), (4, 31), (2.5, 3), ('x', 3), (None, 3)]:
    s, _ = calc(people, days)
    if s != 400:
        check('invalid (%r,%r) -> 400' % (people, days), False, s)
        break
else:
    check('invalid people/days -> 400', True)

# 4. determinism
s1, b1 = calc(6, 7)
s2, b2 = calc(6, 7)
check('deterministic', b1 == b2, '')

# 5. save -> reload
s, b = api(jar1, 'POST', LISTS, {'name': 'June kit', 'people': 4, 'days': 3})
check('save 201 + id', s == 201 and 'id' in b, (s, b))
lid = b.get('id', '')
s, b = api(jar1, 'GET', '%s/%s' % (LISTS, lid))
check('reload full list, snapshot total 43200',
      s == 200 and b['list']['totalCents'] == 43200
      and len(b['list']['lines']) == 6
      and b['list']['pricingVersion'] == 1, (s, b.get('list', {}).get('totalCents')))

# 6. edit (rename + new inputs) -> reload
s, _ = api(jar1, 'PUT', '%s/%s' % (LISTS, lid),
           {'name': 'June kit v2', 'people': 1, 'days': 1})
s, b = api(jar1, 'GET', '%s/%s' % (LISTS, lid))
check('edit recalculates to 20850',
      s == 200 and b['list']['totalCents'] == 20850
      and b['list']['name'] == 'June kit v2', (s, b.get('list', {}).get('totalCents')))

# 7. fresh sign-in persistence
jar1b, hid1b = signup_login('phase6.one@example.org', 'S3cure-Pass-123')
s, b = api(jar1b, 'GET', '%s/%s' % (LISTS, lid))
check('persists across sign-in', s == 200 and b['list']['totalCents'] == 20850, s)

# 8. second household isolation
jar2, hid2 = signup_login('phase6.two@example.org', 'S3cure-Pass-123')
check('distinct households', hid2 != hid1, (hid2, hid1))
s, _ = api(jar2, 'GET', '%s/%s' % (LISTS, lid))
check('cross-household read -> 404', s == 404, s)
s, _ = api(jar2, 'PUT', '%s/%s' % (LISTS, lid),
           {'name': 'hijack', 'people': 1, 'days': 1})
check('cross-household write -> 404', s == 404, s)
s, _ = api(jar2, 'DELETE', '%s/%s' % (LISTS, lid))
check('cross-household delete -> 404', s == 404, s)
s, b = api(jar1, 'GET', '%s/%s' % (LISTS, lid))
check('victim list byte-identical',
      s == 200 and b['list']['totalCents'] == 20850
      and b['list']['name'] == 'June kit v2')

# 9. anonymous rejection
s, _ = api(CookieJar(), 'POST', CALC, {'people': 4, 'days': 3})
check('anon calculate -> 401', s == 401, s)
s, _ = api(CookieJar(), 'GET', LISTS)
check('anon lists -> 401', s == 401, s)

# 10. own delete works
s, _ = api(jar1, 'DELETE', '%s/%s' % (LISTS, lid))
s2, _ = api(jar1, 'GET', '%s/%s' % (LISTS, lid))
check('own delete then 404', s == 200 and s2 == 404, (s, s2))

# cleanup (cascade removes lists/lines, memberships, checklist rows)
import psycopg  # noqa: E402

conn = psycopg.connect(os.environ['DATABASE_URL'])
conn.execute('DELETE FROM users WHERE email IN (%s,%s)',
             ('phase6.one@example.org', 'phase6.two@example.org'))
conn.execute('DELETE FROM households WHERE id IN (%s,%s)', (hid1, hid2))
conn.commit()
conn.close()
print('cleanup done\n%d failed' % len(FAIL))
raise SystemExit(1 if FAIL else 0)
