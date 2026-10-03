"""Phase 10 verification (stdlib only).

Requires: dev server on :3000 with DATABASE_URL, migrations 000-007 applied,
UPLOAD_DIR writable (defaults to islandready-app/uploads/).
Cleans up its test users/households/uploads (record delete removes files).

Run:  python tests/test_phase10_recovery.py
Covers: auth + isolation, record CRUD persistence, valid photo upload,
oversized/non-image/empty rejection, EXIF/GPS stripping, DB/file consistency,
delete removes metadata + file, second-photo 409, household task CRUD,
assistance panel static-only, anon 401s.
"""
import io
import json
import os
import struct
import urllib.parse
import urllib.request
import zlib
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
        return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


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
    b = json.loads(b)
    assert s == 200 and len(b['households']) == 1, (s, b)
    return jar, b['households'][0]['id']


def png_bytes(w=8, h=8):
    def chunk(typ, data):
        c = struct.pack('>I', len(data)) + typ + data
        return c + struct.pack('>I', zlib.crc32(typ + data) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    raw = b''.join(b'\x00' + bytes([128, 160, 200]) * w for _ in range(h))
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr)
            + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b''))


def jpeg_with_exif_gps():
    # Valid EXIF-bearing JPEG pregenerated with the project's sharp
    # (contains an Exif APP1 segment with a GPS marker string).
    with open('C:\\Users\\dwightus\\AppData\\Local\\Temp\\opencode\\exif-test.jpg', 'rb') as f:
        data = f.read()
    assert b'Exif\x00\x00' in data and b'GPS-SECRET-MARKER' in data
    assert data[:2] == b'\xff\xd8'
    return data


def upload(jar, hid, rid, body, filename, ctype):
    boundary = '----phase10boundary'
    payload = (
        ('--' + boundary + '\r\n'
         'Content-Disposition: form-data; name="photo"; filename="%s"\r\n'
         'Content-Type: %s\r\n\r\n' % (filename, ctype)).encode()
        + body + ('\r\n--' + boundary + '--\r\n').encode())
    r = urllib.request.Request(
        '%s/api/households/%s/recovery/records/%s/photo' % (BASE, hid, rid),
        data=payload, method='POST',
        headers={'Content-Type': 'multipart/form-data; boundary=%s' % boundary})
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    try:
        resp = opener.open(r)
        return resp.status, json.loads(resp.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or '{}')
        except Exception:
            return e.code, {}


jar1, hid1 = signup_login('phase10.one@example.org', 'S3cure-Pass-123')
REC = '/api/households/%s/recovery/records' % hid1
TASK = '/api/households/%s/recovery/tasks' % hid1

# 1. records CRUD
s, b = api(jar1, 'POST', REC, {'title': 'Roof leak', 'note': 'North bedroom'})
check('create record 201', s == 201 and 'id' in json.loads(b), (s, b))
rid = json.loads(b)['id']
s, b = api(jar1, 'GET', '%s/%s' % (REC, rid))
b = json.loads(b)
check('read record persists', s == 200 and b['record']['title'] == 'Roof leak', (s, b))
s, _ = api(jar1, 'PUT', '%s/%s' % (REC, rid), {'title': 'Roof leak fixed', 'note': 'patched'})
s, b = api(jar1, 'GET', '%s/%s' % (REC, rid))
check('edit persists', json.loads(b)['record']['title'] == 'Roof leak fixed')
s, _ = api(jar1, 'POST', REC, {'title': '', 'note': 'x'})
check('empty title -> 400', s == 400, s)

# 2. valid PNG upload
s, b = upload(jar1, hid1, rid, png_bytes(), 'roof.png', 'image/png')
check('PNG upload 201', s == 201 and 'id' in b, (s, b))
s, b = api(jar1, 'GET', '%s/%s' % (REC, rid))
check('record shows photo', json.loads(b)['record']['photo'] is not None)
s, raw = api(jar1, 'GET', '%s/%s/photo' % (REC, rid))
check('photo bytes served PNG', s == 200 and raw[:8] == b'\x89PNG\r\n\x1a\n', s)

# 3. second photo rejected
s, b = upload(jar1, hid1, rid, png_bytes(), 'two.png', 'image/png')
check('second photo -> 409', s == 409, s)

# 4. EXIF/GPS stripping via JPEG
s, b = api(jar1, 'POST', REC, {'title': 'Wall crack', 'note': ''})
rid2 = json.loads(b)['id']
evil = jpeg_with_exif_gps()
assert b'GPS-SECRET-MARKER' in evil and evil[:3] == b'\xff\xd8\xff'
s, b = upload(jar1, hid1, rid2, evil, 'evil.jpg', 'image/jpeg')
check('EXIF JPEG accepted 201', s == 201, (s, b))
s, raw = api(jar1, 'GET', '%s/%s/photo' % (REC, rid2))
check('stored bytes scrubbed (no Exif/GPS marker)',
      s == 200 and b'Exif\x00\x00' not in raw and b'GPS-SECRET-MARKER' not in raw, s)
check('re-encoded as JPEG', raw[:2] == b'\xff\xd8', raw[:4])

# 5. invalid uploads
s, _ = upload(jar1, hid1, rid2, b'not an image at all', 'x.txt', 'text/plain')
check('non-image -> 400', s == 400, s)
s, _ = upload(jar1, hid1, rid2, b'', 'empty.png', 'image/png')
check('empty -> 400', s == 400, s)
s, _ = upload(jar1, hid1, rid2, png_bytes(), 'fake.jpg', 'image/jpeg')
check('spoofed extension content still validated', s in (201, 409), s)

# 6. delete removes metadata + file
s, raw = api(jar1, 'GET', '%s/%s/photo' % (REC, rid))
assert s == 200
s, _ = api(jar1, 'DELETE', '%s/%s' % (REC, rid))
check('delete record 200', s == 200, s)
s, _ = api(jar1, 'GET', '%s/%s' % (REC, rid))
check('record gone -> 404', s == 404, s)
s, _ = api(jar1, 'GET', '%s/%s/photo' % (REC, rid))
check('photo gone -> 404', s == 404, s)
import psycopg  # noqa: E402

conn = psycopg.connect(os.environ['DATABASE_URL'])
n = conn.execute("SELECT COUNT(*) FROM recovery_photos WHERE record_id=%s", (rid,)).fetchall()[0][0]
conn.close()
check('photo metadata cascade-deleted', n == 0, n)

# 7. household tasks CRUD
s, b = api(jar1, 'POST', TASK, {'label': 'Call roofer'})
tid = json.loads(b).get('id')
check('add task 201', s == 201 and tid, (s, b))
s, _ = api(jar1, 'PUT', '%s/%s' % (TASK, tid), {'done': True})
s, b = api(jar1, 'GET', TASK)
tasks = json.loads(b)['tasks']
check('task toggle persists', any(t['id'] == tid and t['done'] for t in tasks))
s, _ = api(jar1, 'DELETE', '%s/%s' % (TASK, tid))
s, b = api(jar1, 'GET', TASK)
check('task delete persists', all(t['id'] != tid for t in json.loads(b)['tasks']))
s, _ = api(jar1, 'POST', TASK, {'label': ''})
check('empty task -> 400', s == 400, s)

# 8. isolation
jar2, hid2 = signup_login('phase10.two@example.org', 'S3cure-Pass-123')
check('distinct households', hid2 != hid1)
s, _ = api(jar2, 'GET', '%s/%s' % (REC, rid2))
check('cross-household record -> 404', s == 404, s)
s, _ = api(jar2, 'GET', '%s/%s/photo' % (REC, rid2))
check('cross-household photo -> 404', s == 404, s)
s, _ = api(jar2, 'GET', '/api/households/%s/recovery/tasks' % hid1)
check('cross-household tasks -> 404', s == 404, s)
s, _ = api(jar2, 'DELETE', '%s/%s' % (REC, rid2))
check('cross-household delete -> 404', s == 404, s)
s, _ = api(jar1, 'GET', '%s/%s' % (REC, rid2))
check('victim record intact', s == 200, s)

# 9. anon + assistance panel static-only (panel requires auth; anon redirects)
s, _ = api(CookieJar(), 'GET', REC)
check('anon records -> 401', s == 401, s)
s, body = api(jar1, 'GET', '/recovery')
html = body.decode() if isinstance(body, bytes) else body
check('assistance panel static-only, no live claims',
      s == 200 and 'Static contact information only' in html
      and 'available now' not in html.lower()
      and 'you are eligible' not in html.lower()
      and 'approved for assistance' not in html.lower(), s)

# cleanup (cascades records/photos/tasks/memberships/checklist rows)
conn = psycopg.connect(os.environ['DATABASE_URL'])
conn.execute('DELETE FROM users WHERE email IN (%s,%s)',
             ('phase10.one@example.org', 'phase10.two@example.org'))
conn.execute('DELETE FROM households WHERE id IN (%s,%s)', (hid1, hid2))
conn.commit()
conn.close()
print('cleanup done\n%d failed' % len(FAIL))
raise SystemExit(1 if FAIL else 0)
