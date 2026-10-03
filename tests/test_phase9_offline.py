"""Phase 9 verification (stdlib + static analysis, no browser needed).

Requires: dev server on :3000 with DATABASE_URL, migrations 000-006 applied.
Cleans up its test users/households.

Stated honestly: headless checks below are API/artifact-level. They do NOT
constitute a physical radio-off browser test. What they prove: the offline
artifacts exist and are valid; the pack allowlist excludes live/operational
and secret material; lifecycle rules (logout-clear, user switch, namespacing)
hold; the SW never caches sensitive traffic (asserted from its own source).

Run:  python tests/test_phase9_offline.py
"""
import json
import os
import re
import urllib.parse
import urllib.request
from http.cookiejar import CookieJar

BASE = 'http://localhost:3000'
FAIL = []
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


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

# 1. manifest valid with required fields
s, body = api(CookieJar(), 'GET', '/manifest.webmanifest')
try:
    man = json.loads(body)
    check('manifest valid', s == 200 and man.get('name') == 'IslandReady AI'
          and man.get('theme_color') == '#07333d'
          and 'icons' not in man, (s, man))
except Exception as e:
    check('manifest valid', False, e)

# 2. service worker served + static rules asserted from its source
s, sw = api(CookieJar(), 'GET', '/sw.js')
check('sw served', s == 200 and 'CACHE' in sw, s)
with open(os.path.join(REPO, 'islandready-app', 'public', 'sw.js'), encoding='utf-8') as f:
    src = f.read()
check('SW never caches POST', 'request.method !== "GET"' in src)
check('SW never caches /api/*', 'startsWith("/api/")' in src)
check('SW caches shell + /offline fallback',
      'caches.match("/offline")' in src and '/offline' in src)
check('SW stores no browser data (no local/session storage)',
      'localStorage' not in src and 'sessionStorage' not in src)

# 3. offline page shell served (login-gated when online-anon -> redirect is fine)
s, _ = api(CookieJar(), 'GET', '/offline')
check('offline route exists (200 authed-only or 307 login)',
      s in (200, 307), s)

# 4. pack allowlist: sync via API and inspect keys for banned material
def signup_login(email, password):
    jar = CookieJar()
    st, _ = api(jar, 'POST', '/api/auth/signup',
                {'email': email, 'password': password, 'community': 'Castries'})
    assert st in (200, 201), st
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
    st, b = api(jar, 'GET', '/api/households')
    assert st == 200, st
    return jar, json.loads(b)['households'][0]['id']


jar1, hid1 = signup_login('phase9.one@example.org', 'S3cure-Pass-123')
s, b = api(jar1, 'POST', '/api/households/%s/family-plan' % hid1,
           {'meetingPoint': 'Hall', 'contacts': [{'label': 'Mom', 'phone': '758-555-0100'}],
            'roles': [{'member': 'Dad', 'responsibility': 'shutters'}]})
assert s == 200, (s, b)
# pack shape mirrors offline-pack.ts allowlist; fetch each endpoint like syncPack does
pack = {}
for name, path in [('households', '/api/households'),
                   ('checklist', '/api/households/%s/checklist' % hid1),
                   ('score', '/api/households/%s/score' % hid1),
                   ('family', '/api/households/%s/family-plan' % hid1),
                   ('lists', '/api/households/%s/supplies/lists' % hid1)]:
    st, body = api(jar1, 'GET', path)
    pack[name] = json.loads(body) if st == 200 else None
blob = json.dumps(pack).lower()
banned = ['password', 'session-token', 'nextauth', 'secret', 'warning',
          'evacuation order', 'shelter availability', 'watch', 'advisory',
          'melissa', 'nhc', 'noaa']
found = [w for w in banned if w in blob]
check('pack allowlist: no secrets/live material', found == [], found)

# 5. lifecycle rules present in client store source
with open(os.path.join(REPO, 'islandready-app', 'src', 'lib', 'offline-pack.ts'),
          encoding='utf-8') as f:
    store = f.read()
for name, needle in [('single versioned key', 'ir_pack_v1_'),
                     ('userId match gate', 'pack.userId !== userId'),
                     ('clearPack exists', 'removeItem'),
                     ('sync failure honesty', 'ok: false'),
                     ('never-store list documented', 'NEVER stored')]:
    check('store: ' + name, needle in store, needle)
check('signout clears pack',
      'clearPack' in open(os.path.join(
          REPO, 'islandready-app', 'src', 'app', 'dashboard',
          'signout-button.tsx'), encoding='utf-8').read())

# 6. isolation: second user cannot read first user's pack server-side
jar2, hid2 = signup_login('phase9.two@example.org', 'S3cure-Pass-123')
s, _ = api(jar2, 'GET', '/api/households/%s/family-plan' % hid1)
check('cross-household family-plan -> 404', s == 404, s)
s, _ = api(jar2, 'GET', '/api/households/%s/checklist' % hid1)
check('cross-household checklist -> 404', s == 404, s)

# 7. assistant offline UI text present (online-only honesty)
s, body = api(CookieJar(), 'GET', '/assistant')
check('assistant offline-unavailable text served',
      s == 200 and 'unavailable offline' in body.lower(), s)

# 8. offline viewer labels last-synced + not-current
with open(os.path.join(REPO, 'islandready-app', 'src', 'components',
                       'OfflinePackView.tsx'), encoding='utf-8') as f:
    view = f.read()
check('viewer shows syncedAt + not-current',
      'last synced' in view.lower() and 'not current' in view.lower())

# cleanup
import psycopg  # noqa: E402

conn = psycopg.connect(os.environ['DATABASE_URL'])
conn.execute('DELETE FROM users WHERE email IN (%s,%s)',
             ('phase9.one@example.org', 'phase9.two@example.org'))
conn.execute('DELETE FROM households WHERE id IN (%s,%s)', (hid1, hid2))
conn.commit()
conn.close()
print('cleanup done\n%d failed' % len(FAIL))
raise SystemExit(1 if FAIL else 0)
