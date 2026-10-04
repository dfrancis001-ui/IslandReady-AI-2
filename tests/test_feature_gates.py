"""Deployment feature-gate tests (stdlib only).

Requires: dev server started with FEATURE_AI=false and FEATURE_UPLOADS=false,
DATABASE_URL set, migrations applied. Cleans up its test users/households.

Run (server must run with both flags false):
  python tests/test_feature_gates.py
Covers: AI gate blocks generation fast + honest 503; uploads gate blocks with
honest 503; records/tasks unaffected; assistant/recovery pages show disabled
messaging. Full-behavior suites (Phase 8/10) cover the enabled path.
"""
import json
import os
import time
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
        return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


import urllib.error  # noqa: E402

jar = CookieJar()
s, _ = api(jar, 'POST', '/api/auth/signup',
           {'email': 'gates.one@example.org', 'password': 'S3cure-Pass-123',
            'community': 'Castries'})
assert s in (200, 201), s
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
csrf = json.loads(op.open(BASE + '/api/auth/csrf').read().decode())['csrfToken']
op2 = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar), NR())
try:
    op2.open(urllib.request.Request(
        BASE + '/api/auth/callback/credentials',
        data=urllib.parse.urlencode(
            {'csrfToken': csrf, 'email': 'gates.one@example.org',
             'password': 'S3cure-Pass-123'}).encode(), method='POST'))
except urllib.error.HTTPError:
    pass
s, b = api(jar, 'GET', '/api/households')
hid = json.loads(b)['households'][0]['id']

# a/b. AI gate: fast honest 503, no generation delay (generation takes 10s+)
t0 = time.time()
s, b = api(jar, 'POST', '/api/households/%s/assistant/ask' % hid,
           {'question': 'How do I prepare my home for a hurricane?'})
dt = time.time() - t0
b = json.loads(b)
check('AI disabled: fast honest 503, no generation',
      s == 503 and b.get('available') is False
      and 'unavailable' in b.get('error', '').lower() and dt < 5.0, (s, dt, b))

# c/d. uploads gate: honest 503 before reading any file
boundary = '----gates'
payload = ('--' + boundary + '\r\nContent-Disposition: form-data; name="x"\r\n\r\n'
           'y\r\n--' + boundary + '--\r\n').encode()
s, b = api(jar, 'POST', '/api/households/%s/recovery/records/rr-nope/photo' % hid, None)
# (record must exist first for a clean gate test)
s, b = api(jar, 'POST', '/api/households/%s/recovery/records' % hid,
           {'title': 'Gate check', 'note': ''})
rid = json.loads(b)['id']
r = urllib.request.Request(
    '%s/api/households/%s/recovery/records/%s/photo' % (BASE, hid, rid),
    data=payload, method='POST',
    headers={'Content-Type': 'multipart/form-data; boundary=%s' % boundary})
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
try:
    resp = opener.open(r)
    s, b = resp.status, json.loads(resp.read().decode())
except urllib.error.HTTPError as e:
    s, b = e.code, json.loads(e.read().decode())
check('uploads disabled: honest 503, nothing stored',
      s == 503 and b.get('available') is False
      and 'unavailable' in b.get('error', '').lower(), (s, b))

# e. records/tasks unaffected by the uploads gate
s, b = api(jar, 'POST', '/api/households/%s/recovery/records' % hid,
           {'title': 'Still works', 'note': ''})
check('records work with uploads off', s == 201 and 'id' in json.loads(b), s)
s, b = api(jar, 'POST', '/api/households/%s/recovery/tasks' % hid, {'label': 'T'})
check('tasks work with uploads off', s == 201, s)

# UI disabled messaging served in pages (authenticated session required)
for path, needle in [('/assistant', 'temporarily unavailable'),
                     ('/recovery', 'temporarily unavailable')]:
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    try:
        body = opener.open(BASE + path).read().decode()
        check('%s shows disabled notice' % path, needle in body.lower(), len(body))
    except urllib.error.HTTPError as e:
        check('%s shows disabled notice' % path, False, e.code)

# cleanup
import psycopg  # noqa: E402

conn = psycopg.connect(os.environ['DATABASE_URL'])
conn.execute('DELETE FROM users WHERE email=%s', ('gates.one@example.org',))
conn.execute('DELETE FROM households WHERE id=%s', (hid,))
conn.commit()
conn.close()
print('cleanup done\n%d failed' % len(FAIL))
raise SystemExit(1 if FAIL else 0)
