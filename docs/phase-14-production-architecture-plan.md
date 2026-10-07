# Phase 14 — Production Architecture Plan (planning only, no build)

**Status labels:** ✅ **BUILT NOW** · 📋 **PLANNED** · 🏗️ **REQUIRES PRODUCTION INFRASTRUCTURE** ·
🧪 **REQUIRES REAL-WORLD PILOT EVIDENCE** · 📝 **REQUIRES EXTERNAL PERMISSION**

> No infrastructure is provisioned, no migration is run, and no pilot results are
> claimed in this document. All "current state" statements were verified against
> the repository (paths cited). Netlify remains the intended deployment target
> but stays parked — nothing here deploys anything.

## 1. Current architecture (✅ BUILT NOW, verified)

- **App:** Next.js 16.3.8 App Router + React 19 + TypeScript
  (`islandready-app/package.json`). Scripts: `dev` / `build` (`next build`) /
  `start` (`next start`) / `lint`. No static export; dynamic routes +
  middleware (`islandready-app/middleware.ts`) require a server runtime.
- **Auth:** Auth.js (next-auth v4) credentials provider + JWT sessions
  (`src/lib/auth.ts`): bcrypt-hashed passwords, uniform null on unknown-email
  and wrong-password (no enumeration), dummy-hash timing cover, custom sign-in
  page `/login`. `middleware.ts` (next-auth middleware) protects
  `/dashboard/:path*`; `/api/*` routes self-authenticate and return 401 JSON
  (no redirects).
- **Database:** PostgreSQL via `pg` Pool, `DATABASE_URL` from process env only,
  lazy pool creation so builds never need a DB (`src/lib/db.ts`). Migration
  chain in `db/migrations/`: 000_households, 001_readiness, 003_users_auth,
  004_family_plan, 005_supplies, 006_kb, 007_recovery, 008_orgs (+ `down/`
  rollbacks; seeds in `db/seeds/`). Households carry
  `country TEXT NOT NULL DEFAULT 'Saint Lucia'` (`000_households.sql`) — the
  per-country discriminator the expansion plan builds on.
- **Supply pricing:** EC$ baseline catalog, all money integer cents, saved lists
  snapshot lines+prices with `pricing_version` (`db/migrations/005_supplies.sql`
  header; fixtures 1p/1d=208.50, 4p/3d=432.00, 6p/7d=1052.00). Rates are
  planning baselines, NOT market survey or live retail.
- **File storage:** Recovery photos live on the **local filesystem**
  (`UPLOAD_DIR` or `islandready-app/uploads/`); only metadata in Postgres
  (`src/lib/recovery.ts`). Controls ✅ BUILT: 5 MB cap (`MAX_PHOTO_BYTES`),
  magic-byte sniff (JPEG/PNG only, filename/MIME never trusted), sharp
  re-encode (strips EXIF/GPS), max 1 photo per record, membership + record
  ownership checked on every op.
- **AI/RAG:** Ollama-only behind a provider abstraction (`src/lib/rag/provider.ts`;
  defaults `http://127.0.0.1:11434`, `nomic-embed-text`, `llama3.2:1b`);
  server-side only, never reaches the browser. Safety layer fail-closed
  (`src/lib/safety.ts`); demo corpus only (`db/seeds/006_demo_corpus.json`).
  Feature gates `FEATURE_AI` / `FEATURE_UPLOADS` return honest 503s when
  disabled (`src/lib/features.ts`) — the serverless lever.
- **Offline/PWA:** `public/sw.js` caches static shell only
  (`islandready-shell-v1`: `/offline`, `/login`, manifest); never caches
  POST/PUT/DELETE, `/api/auth/*`, household APIs, or credentials. Versioned
  per-user localStorage pack `ir_pack_v1_<userId>` with minimum-allowlist data,
  sign-out clears it, every offline view shows syncedAt + "not current"
  (`src/lib/offline-pack.ts`). Manifest exists but has **no icons** → not
  installable yet (PWA completion is an Assessment-11 task).
- **Aggregates/privacy:** `/api/institutional/metrics` is platform-admin only,
  aggregates ONLY, `MIN_HOUSEHOLDS = 5` suppression
  (`src/app/api/institutional/metrics/route.ts`, `src/lib/orgs.ts` audit).
- **Security headers:** `next.config.ts` sets nosniff, strict referrer,
  `X-Frame-Options: DENY` + `frame-ancestors 'none'`, HSTS (HTTPS only),
  same-origin CSP (unsafe-inline only for Next.js hydration/styles).
- **Rate limiting:** in-memory sliding window, single-process
  (`src/lib/rate-limit.ts`) — honest 429 JSON, no account leakage.
- **Netlify config (repo):** `netlify.toml`: `base = "islandready-app"`,
  `command = "npm run build"`, `publish = ".next"`; secrets live in the
  dashboard, never in the file. Production 404 diagnosis is parked (not this phase).

## 2. Hosted PostgreSQL migration (🏗️ REQUIRES PRODUCTION INFRASTRUCTURE)

1. Provision a hosted Postgres (provider TBD — e.g. Neon/Supabase/RDS) with TLS
   enforced, automated daily backups + point-in-time recovery, and a least-privilege
   app role (no superuser).
2. Code change required: `src/lib/db.ts` currently passes only `connectionString`
   with **no SSL option** — add `ssl: { rejectUnauthorized: true }` (or
   provider-prescribed CA) for production; keep local path unchanged.
3. Apply migrations in order with `psql $DATABASE_URL -f` per file headers (000 →
   001 → 003 → 004 → 005 → 006 → 007 → 008; note: no `002_*.sql` migration exists —
   `002_*` is a seed file, not a gap). Verify with a schema-diff before opening traffic.
4. Rotate credentials via dashboard env only; never commit `.env`.
5. Connection pooling: start with `pg` Pool defaults against hosted PG; add
   PgBouncer/pooler only if load testing (see performance plan) shows exhaustion.

## 3. Production authentication configuration (📋 PLANNED, 🏗️ infra)

- Set `NEXTAUTH_URL` to the production origin and generate a fresh
  `NEXTAUTH_SECRET` (32+ random bytes) in dashboard env — ✅ code already reads
  both from env; only values change.
- Keep JWT sessions (no adapter tables needed); confirm cookie `Secure` +
  `HttpOnly` + `SameSite=Lax` under HTTPS in the smoke test.
- No code change to the credentials flow for launch; password-reset and
  optional OAuth are explicitly out of scope until pilot evidence demands them.

## 4. Secure file storage (📋 PLANNED, 🏗️ infra)

- Current local-disk uploads do **not** survive serverless/ephemeral disks.
- Production: move photo binaries to object storage (provider TBD — e.g. S3/R2)
  with private bucket + signed-URL reads; keep ALL existing controls (5 MB cap,
  magic-byte sniff, sharp EXIF strip, 1-per-record, membership checks) by moving
  them ahead of the storage put. DB keeps metadata + object key (replace
  `stored_path` semantics; migrate existing rows or start clean with a recorded decision).
- `FEATURE_UPLOADS=false` remains the fallback where no persistent storage exists
  (records/tasks keep working; honest 503 on photo upload).

## 5. Monitoring (📋 PLANNED, 🏗️ infra)

- Today: no APM in the repo; errors surface as honest JSON (401/404/429/503).
- Production minimum: uptime check on `/login` + authenticated `/api/households`
  probe; error-rate and latency alerts on API routes + middleware; DB connection
  and slow-query alerts; storage quota alerts; deploy notifications.
- Privacy constraint: logs must never contain credentials, session tokens, photo
  binaries, or household PII beyond IDs needed for debugging; 30-day query-log
  retention with scheduled purge (purge job itself is 📋 PLANNED — no purge
  script file exists in the repo today).

## 6. Backups (📋 PLANNED, 🏗️ infra — procedure in the backup/recovery plan doc)

- Hosted-PG automated daily snapshots + PITR; pre-deploy manual snapshot;
  object-storage versioning/replication for photos; restore drill before pilot
  data counts as real. RTO/RPO targets are set in the backup plan and validated
  by drill, not asserted here.

## 7. Security controls carried into production (✅ BUILT NOW, re-verified in prod)

Membership-scoped queries everywhere, uniform auth failures, bcrypt, JWT,
security headers, rate limits (see §8 caveat), upload controls + EXIF strip,
aggregate suppression + audit, offline allowlist + sign-out clear. The security
test plan re-verifies each control against production.

## 8. Known production gaps (must close before launch)

1. DB SSL option missing in `src/lib/db.ts` (see §2).
2. In-memory rate limiter is single-process — multi-instance production needs a
   shared store (e.g. Redis); file header already documents this (📋 PLANNED).
3. Local-disk uploads need object storage (see §4).
4. No purge scheduler for the 30-day retention policy (📋 PLANNED).
5. PWA icons missing → installability open (Assessment-11 task, independent track).
6. AI provider is localhost Ollama — production needs a hosted model endpoint or
   `FEATURE_AI=false` with documented degraded behavior (📋 decision, 🏗️ infra).

## 9. NFR compliance mapping (PRD)

- **Offline-first:** shell + versioned pack + airplane-mode flow ✅ built; <5 MB
  requirement governs the pack (allowlist-only design; production perf plan
  asserts measured pack size per household — no figure asserted here).
- **Privacy:** aggregates-only reporting with n≥5 suppression, audit trail,
  minimum-necessity pack contents ✅ built; retention purge 📋 planned.
- **Accessibility:** semantic HTML + keyboard-navigable flows in current pages;
  full WCAG audit against production is 📋 PLANNED (assistive-tech pass is part
  of the pilot iteration, 🧪 pilot evidence).
