"""Phase 5 verification (stdlib only).

Requires: dev server on :3000 with DATABASE_URL, migrations 000-004 applied.
Cleans up its test users/households (cascade removes plans/contacts/roles).

Run:  python tests/test_phase5_family.py
Covers: create sample plan (St. Jude's hall, Mom/neighbor, Dad/Mom/Gran roles,
comms plan, backup, evacuation), reload persistence, edit persistence,
sign-out/sign-in persistence, second-household read/write denial (404),
invalid input rejection (400).
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

SAMPLE = {
    'meetingPoint': "St. Jude's hall",
    'backupMeetingPoint': "Aunt Mary's verandah, Morne Fortune",
    'evacuationInfo': 'Castries route, family car, shelter list at NEMO office',
    'commsPlan': 'Group text first, then radio check on the hour',
    'nextSteps': 'Secure home, grab baby bag, confirm meeting point',
    'contacts': [
        {'label': 'Mom (lead)', 'phone': '758-555-0142', 'note': ''},
        {'label': 'Neighbor - Mr. Louis', 'phone': '758-555-0188', 'note': ''},
    ],
    'roles': [
        {'member': 'Dad', 'responsibility': 'shutters and outdoor items'},
        {'member': 'Mom', 'responsibility': 'docs and baby bag'},
        {'member': 'Gran', 'responsibility': 'meds'},
    ],
}


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


jar1, hid1 = signup_login('phase5.one@example.org', 'S3cure-Pass-123')

# 1. no plan yet -> 404
s, _ = api(jar1, 'GET', '/api/households/%s/family-plan' % hid1)
check('empty plan -> 404', s == 404, s)

# 2. create sample plan
s, b = api(jar1, 'POST', '/api/households/%s/family-plan' % hid1, SAMPLE)
check('create plan 200 {ok:true}', s == 200 and b.get('ok') is True, (s, b))

# 3. reload -> every field persists
s, b = api(jar1, 'GET', '/api/households/%s/family-plan' % hid1)
p = b.get('plan', {})
check('reload persists all fields',
      s == 200 and p.get('meetingPoint') == SAMPLE['meetingPoint']
      and p.get('backupMeetingPoint') == SAMPLE['backupMeetingPoint']
      and p.get('evacuationInfo') == SAMPLE['evacuationInfo']
      and p.get('commsPlan') == SAMPLE['commsPlan']
      and p.get('nextSteps') == SAMPLE['nextSteps']
      and [(c['label'], c['phone']) for c in p.get('contacts', [])] ==
      [(c['label'], c['phone']) for c in SAMPLE['contacts']]
      and [(r['member'], r['responsibility']) for r in p.get('roles', [])] ==
      [(r['member'], r['responsibility']) for r in SAMPLE['roles']], (s, p))

# 4. edit -> persists
edited = dict(SAMPLE, meetingPoint='Community center hall',
              contacts=[dict(SAMPLE['contacts'][0], phone='758-555-0199')],
              roles=SAMPLE['roles'][:2])
s, _ = api(jar1, 'POST', '/api/households/%s/family-plan' % hid1, edited)
s, b = api(jar1, 'GET', '/api/households/%s/family-plan' % hid1)
p = b.get('plan', {})
check('edit persists',
      p.get('meetingPoint') == 'Community center hall'
      and p.get('contacts', [{}])[0].get('phone') == '758-555-0199'
      and len(p.get('roles', [])) == 2, p)

# 5. sign out/in (fresh jar) -> persists
jar1b, hid1b = signup_login('phase5.one@example.org', 'S3cure-Pass-123')
s, b = api(jar1b, 'GET', '/api/households/%s/family-plan' % hid1b)
check('persists across sign-in (same household)',
      hid1b == hid1 and b.get('plan', {}).get('meetingPoint') == 'Community center hall',
      (hid1b, hid1))

# 6. second household isolation
jar2, hid2 = signup_login('phase5.two@example.org', 'S3cure-Pass-123')
check('distinct households', hid2 != hid1, (hid2, hid1))
s, _ = api(jar2, 'GET', '/api/households/%s/family-plan' % hid1)
check('cross-household read -> 404', s == 404, s)
s, _ = api(jar2, 'POST', '/api/households/%s/family-plan' % hid1, SAMPLE)
check('cross-household write -> 404', s == 404, s)
s, b = api(jar1, 'GET', '/api/households/%s/family-plan' % hid1)
check('first plan untouched by outsider',
      b.get('plan', {}).get('meetingPoint') == 'Community center hall')

# 7. invalid inputs
s, _ = api(jar1, 'POST', '/api/households/%s/family-plan' % hid1, {})
check('missing meeting point -> 400', s == 400, s)
bad = dict(SAMPLE, contacts=[{'label': 'X', 'phone': 'abc', 'note': ''}])
s, _ = api(jar1, 'POST', '/api/households/%s/family-plan' % hid1, bad)
check('bad phone -> 400', s == 400, s)
bad = dict(SAMPLE, roles=[{'member': '', 'responsibility': 'y'}])
s, _ = api(jar1, 'POST', '/api/households/%s/family-plan' % hid1, bad)
check('empty role member -> 400', s == 400, s)
s, _ = api(jar1, 'POST', '/api/households/%s/family-plan' % hid1,
           dict(SAMPLE, contacts=[{'label': 'X', 'phone': '1', 'note': ''}] * 11))
check('too many contacts -> 400', s == 400, s)
s, _ = api(jar_anon := CookieJar(), 'GET',
           '/api/households/%s/family-plan' % hid1)
check('anonymous read -> 401', s == 401, s)

# cleanup (cascade removes plans, contacts, roles, memberships, checklist rows)
import psycopg  # noqa: E402

conn = psycopg.connect(os.environ['DATABASE_URL'])
conn.execute('DELETE FROM users WHERE email IN (%s,%s)',
             ('phase5.one@example.org', 'phase5.two@example.org'))
conn.execute('DELETE FROM households WHERE id IN (%s,%s)', (hid1, hid2))
conn.commit()
conn.close()
print('cleanup done\n%d failed' % len(FAIL))
raise SystemExit(1 if FAIL else 0)
