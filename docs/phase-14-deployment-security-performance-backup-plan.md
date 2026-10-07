# Phase 14 — Deployment, Security, Performance & Backup Plans (planning only)

**Status labels:** ✅ **BUILT NOW** · 📋 **PLANNED** · 🏗️ **REQUIRES PRODUCTION INFRASTRUCTURE** ·
🧪 **REQUIRES REAL-WORLD PILOT EVIDENCE**

> Nothing here deploys, provisions, or claims test results. Every check names the
> code control it verifies (paths cited). Netlify is the intended target; the
> production 404 diagnosis stays parked and no deploy is attempted under this plan.

## A. Deployment plan (📋 PLANNED, Netlify target, parked)

### A.1 Production build (✅ config built, 🏗️ run later)

- Base `islandready-app`, command `npm run build`, publish `.next`
  (`netlify.toml`); Next.js 16.3.8 in `dependencies`; no static export; OpenNext
  adapter path (automatic, unpinned — never the legacy plugin).
- Pre-deploy gate: `npm run build` exit 0 locally (last verified green) + engine
  suite green. Build must show the server Functions bundle in the deploy log;
  a deploy with zero functions is rejected, not debugged from repo code.

### A.2 Environment variables / secrets (🏗️ dashboard only, never in repo)

| Variable | Purpose | Notes |
|---|---|---|
| `DATABASE_URL` | Hosted Postgres connection | TLS enforced; least-privilege role; set in dashboard |
| `NEXTAUTH_SECRET` | Session signing | Fresh 32+ random bytes for production |
| `NEXTAUTH_URL` | Production origin | Must match canonical URL exactly |
| `OLLAMA_HOST` / `OLLAMA_*_MODEL` | AI provider | Hosted endpoint, or omit + set `FEATURE_AI=false` |
| `UPLOAD_DIR` | Photo storage path/prefix | Object-storage target (see architecture plan §4) |
| `FEATURE_AI` / `FEATURE_UPLOADS` | Degradation levers | `false` = honest 503 path (verified in code) |

### A.3 Database migration (🏗️ run at deploy)

1. Snapshot/backup hosted DB before any migration.
2. Apply `db/migrations/` in order (000 → 001 → 003 → 004 → 005 → 006 → 007 → 008)
   with `psql $DATABASE_URL -f` per file headers; seeds (`db/seeds/`) only where
   the file header directs (demo corpus is clearly labeled, never presented as official).
3. Schema-diff verify; record applied versions in the deploy log.

### A.4 Auth / storage configuration (🏗️ at deploy)

- Auth: production `NEXTAUTH_URL` + fresh `NEXTAUTH_SECRET`; verify Secure/HttpOnly/SameSite cookies over HTTPS.
- Storage: object-storage bucket (private) + signed-URL reads; retain all upload
  controls server-side; `FEATURE_UPLOADS=false` fallback documented.

### A.5 Rollback (📋 procedure, 🏗️ executed only if needed)

1. Revert hosting to the previous good deploy (one click / one command, recorded).
2. Database: restore pre-deploy snapshot ONLY if the migration caused the fault
   (decision logged; never auto-restore over new user data without review).
3. Confirm rollback with the smoke test (§A.6) before announcing recovery.

### A.6 Smoke test (post-deploy checklist, ~10 min)

- [ ] `/login` renders 200; signup → login → logout round-trip works.
- [ ] Unauthenticated `/dashboard` redirects to `/login` (middleware).
- [ ] `/api/*` without session returns 401 JSON (no redirect).
- [ ] Household create → score generated → checklist toggle moves score.
- [ ] Family plan save + reload; supply list generate + save + reload.
- [ ] Assistant answer carries sources + disclaimer (or honest 503 if `FEATURE_AI=false`).
- [ ] Offline pack sync → airplane mode → `/offline` serves last-synced pack with staleness label.
- [ ] Recovery note + photo upload within 5 MB (or honest 503 if uploads disabled).
- [ ] Security headers present on responses (see §B.4).
- [ ] Institutional metrics endpoint: 401 signed-out, 403 non-admin, aggregates-only for admin.

## B. Security test plan (checklist; ✅ controls exist, 📋 re-verify in prod)

### B.1 Authentication

- [ ] Signup rejects invalid email / empty password; duplicate email handled without enumeration.
- [ ] Login with wrong password returns the same null-shape as unknown email (uniform failure, `src/lib/auth.ts`).
- [ ] Sessions are JWT via Auth.js; tampered cookie rejected; expired session redirected (web) / 401 (API).
- [ ] `NEXTAUTH_SECRET` is production-fresh and dashboard-only (never in repo/logs).

### B.2 Authorization

- [ ] Cross-household API access returns 404 (not 403 with existence leak) — membership checked first in every lib (`households`, `family`, `recovery`, `orgs` conventions).
- [ ] Record/task/photo ops verify BOTH membership AND record ownership (`src/lib/recovery.ts` `ownedRecord`).
- [ ] Org routes: non-members get 404-shape; platform-admin endpoints (`institutional/metrics`) 403 for non-admins.

### B.3 Rate limiting

- [ ] Auth + AI endpoints throttle to honest 429 JSON under burst (`src/lib/rate-limit.ts`); no account info in 429 body.
- [ ] Production caveat recorded: single-process store → shared store (Redis) required for multi-instance (architecture plan §8).

### B.4 Security headers

- [ ] Verify on production responses: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
  HSTS (HTTPS), same-origin CSP per `next.config.ts`.

### B.5 Session handling

- [ ] Sign-out clears server session AND the user's offline pack (`clearPack` on sign-out; `src/lib/offline-pack.ts`).
- [ ] Stored pack with mismatched `userId` never displays (`readPack` ownership check).
- [ ] No session tokens, passwords, or secrets in localStorage, logs, or client bundles (static grep check).

### B.6 File upload controls + EXIF stripping + size limits

- [ ] Empty file → 400; >5 MB → 400 (`MAX_PHOTO_BYTES`, `src/lib/recovery.ts`).
- [ ] Non-JPEG/PNG (renamed `.exe`, SVG, etc.) rejected by magic-byte sniff — filename/MIME never trusted.
- [ ] Uploaded photo re-encoded via sharp: EXIF/GPS absent in stored bytes; second photo on same record → 409.
- [ ] Stored file unreadable/deleted → photo endpoint returns null-shape, no path leak (`getPhoto`).

### B.7 Privacy / data retention

- [ ] Household data private by default; no PII in URLs, logs, or error bodies.
- [ ] Institutional endpoint returns aggregates ONLY with n<5 suppression (`MIN_HOUSEHOLDS`); access audited (`auditAccess`).
- [ ] 30-day query-log retention + purge scheduler confirmed scheduled in production (policy 📋 PLANNED — no purge script in repo today; verify the job, not just the policy).

### B.8 Offline / local-data handling

- [ ] SW caches shell only (`islandready-shell-v1`); confirm no `/api/*`, POST, or auth payload in cache storage (static analysis of `public/sw.js` + live check).
- [ ] Pack contains allowlist fields only (no passwords/tokens/AI answers/alerts/shelters/weather); every offline view shows syncedAt + "not current".

## C. Performance test plan (plan only — NO results claimed)

Method: local staging first (no credits), then one production pass post-deploy.
Record environment, dataset size, and commit hash with every number; pilot-scale
numbers require 🧪 real participants and are never extrapolated from synthetic data.

| # | Target | Method | Pass criterion (to confirm, not assumed) |
|---|---|---|---|
| P1 | Page load (`/login`, `/dashboard`, `/offline`) | Lighthouse + Web Vitals on throttled 4G | LCP < 2.5s, INP < 200ms, CLS < 0.1; `/offline` usable airplane-mode |
| P2 | API response (score, checklist, family, supplies, recovery CRUD) | Timed `curl`/script, 20 sequential + 10 concurrent | p95 < 500ms local; errors 0 |
| P3 | Readiness scoring | Engine unit timing + parity check (`engine/readiness_v1.py` vs `src/lib/scoring.ts`) | < 50ms per household; parity holds |
| P4 | AI assistant | Ask latency with local Ollama; timeout + honest-failure path | p95 recorded (no target asserted); failures fail closed with disclaimer/503 |
| P5 | Database queries | `EXPLAIN ANALYZE` on household checklist/score/aggregate queries at pilot-scale rows | No sequential scans on hot paths; indexes recorded |
| P6 | Offline pack | Measure serialized pack bytes per household (1/4/8 members, with/without lists) | Pack < 5 MB with margin; sync < 5s on 4G |
| P7 | Concurrent users | 52 concurrent scripted sessions (pilot scale): login → score → checklist toggle | 0 errors; p95 API < 2s; note single-process limiter caveat |
| P8 | Pilot-scale load | 52-household fixture run against staging (synthetic data, clearly labeled) | Baseline recorded; NOT reported as pilot results |

## D. Backup / recovery test plan (📋 procedure; 🏗️ infra; drills unperformed)

- **Database backup strategy:** hosted-PG automated daily snapshots + point-in-time
  recovery; manual snapshot before every production migration; retention ≥ 30 days.
- **Restore procedure:** (1) provision restore target (never overwrite live without
  review); (2) restore snapshot/PITR point; (3) replay/verify migrations;
  (4) run smoke test §A.6 against restored instance; (5) promote only on green.
- **Recovery verification:** quarterly restore drill to a scratch instance +
  checklist (row counts per core table, login round-trip, score recompute match);
  drill log kept with date, operator, snapshot ID, result.
- **File-storage backup:** versioned/replicated object bucket for photos; DB
  metadata ↔ object-key reconciliation check after any restore (orphan report, no
  silent deletes).
- **Rollback procedure:** §A.5 (deploy revert + conditional DB restore).
- **Recovery objectives (proposed, to ratify before launch):** RPO ≤ 24h (daily
  snapshot + PITR), RTO ≤ 4h for full restore, RTO ≤ 30min for deploy-only rollback.
- **Test frequency:** restore drill quarterly + before any pilot-data milestone;
  backup-monitoring alert checked weekly.
- **Honest status:** no backup, restore, or rollback test has been performed —
  all rows above are 📋 PLANNED procedure, not history.
