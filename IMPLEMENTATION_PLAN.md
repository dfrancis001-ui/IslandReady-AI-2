# IslandReady AI — Implementation Plan

**Status:** Stack decided (Next.js + Auth.js + PostgreSQL, local-only). Scaffold present.
Phase 0 exception: persistent local PostgreSQL is BLOCKED — owner has no Windows
administrator password, so the server install waits on admin access. No admin
bypass attempted. Details and reconnect steps: `docs/postgres_local_setup.md`.
Phase 3 engine verification used an isolated embedded test server only.
**Source of truth:** `PRD.md` (v0.1 Starter, 2026-09-26, plus Technical Decision Notes and Implementation Progress notes).
**Launch market:** Saint Lucia first; architecture must allow expansion to other Caribbean countries later.
**Run environment:** Application and database run locally for now. No deployment in any phase below except as a written plan.

## Target Architecture

Every phase must conform to this pipeline (PRD §7):

```
User
  → Household Profile (location / family / needs / preparedness state)
  → Risk Engine (hazard + region, household vulnerability, readiness gaps)
  → Trusted Source / RAG Knowledge (approved NEMO / CDEMA / official guides only)
  → AI Engine (LLM + personalization prompts)
  → Safety Layer (rules, source checks, escalation, disclaimers)
  → IslandReady AI response ("Next Best Action")
```

Hard safety rule carried through all phases: the AI Emergency Assistant must ground
safety-critical answers in retrieved trusted sources. It must never invent official
warnings, shelter availability, evacuation orders, or medical instructions. Every AI
answer cites its source category and defers to official instructions.

## Technology Stack — DECIDED (Phase 0)

Recorded as the confirmed project stack. Local development only unless a later
phase explicitly decides otherwise.

- **Framework: Next.js** (App Router). The approved static prototype (`index.html`,
  styled from `design.html`) remains the UI reference; Phase 4 rebuilds it on Next.js.
- **Authentication: Auth.js** for local authentication (wired in Phase 1, not before).
- **Database: PostgreSQL**, running locally (per PRD Technical Decision Notes; chosen
  over SQLite for multi-household, business, and institutional growth).
  Owner-installed on Windows; application wiring happens after the install is confirmed.
- **Auth:** Local-development authentication only.
  No real user credentials or secrets are ever committed; local-only test accounts.
- **AI:** LLM API + vector store for RAG, wired in Phases 6–7. Prototype AI answers are
  local sample logic and must be replaced by the RAG pipeline, never shipped as final.
- **File storage:** Local filesystem (damage photos, offline pack assets).
- **Repository:** GitHub (`IslandReady-AI-2`).

## MVP Non-Goals (restated from PRD §2 — do not build these)

- No real-time official alert ingestion; link out / defer to official alerts.
- No live shelter availability; static guidance + official shelter list link.
- No insurance claims filing integration; damage photo/note organization only.
- No full B2B/B2G portal; business continuity is a stub only.

---

## Phase 0 — Project Setup and Local Foundation

**Objective:** Establish a runnable local environment and project skeleton so every later
phase has something testable to build on.

**Tasks:**
1. Confirm framework and auth choices (default: carry forward Next.js + Auth.js unless
   review finds a reason to change); record the decision in `PRD.md` or this plan.
2. Create the project folder structure (frontend app, backend API routes, DB migrations,
   RAG ingestion scripts folder, tests folder).
3. Install and configure local PostgreSQL; create development database and roles.
4. Configure environment variables safely (`.env` local-only, never committed;
   provide `.env.example` with placeholder values only).
5. Wire the static prototype screens (`index.html`) as the UI reference for Phase 3;
   confirm the skeleton app opens in a local browser with no errors.

**Dependencies:** None (first phase). Requires the approved PRD and prototype.

**Deliverables:**
- Runnable project skeleton.
- Working local PostgreSQL connection.
- `.env.example` (no real secrets).
- Documented local run instructions.

**Verification:**
- Start the app locally; page loads with zero console/build errors.
- Backend health check responds; database connection check passes.
- Confirm no secrets/`.env` files are tracked by Git.

---

## Phase 1 — User Accounts and Authentication

**Objective:** Secure accounts so each household's private data is isolated to its owner.

**Tasks:**
1. Implement sign-up / sign-in / sign-out (local development configuration).
2. Session handling and route protection for all private pages/APIs.
3. Link authenticated users to household records (one user may belong to one household
   in MVP; model must allow multi-household later for Family Pro).
4. Password handling per auth-library defaults; validate all auth inputs.

**Dependencies:** Phase 0 (skeleton, DB, env config).

**Deliverables:**
- Working local sign-up / sign-in / sign-out.
- Authenticated user ↔ household linkage.
- Protected private routes and API endpoints.

**Verification:**
- Create a test account, sign in, sign out; sessions expire correctly.
- Attempt to open another household's data while signed in → access denied.
- Invalid inputs (bad email, short password, SQL-injection strings) are rejected safely.

---

## Phase 2 — Household Profiles

**Objective:** Capture the household facts that personalize every downstream feature
(score, AI answers, supplies, family plan).

**Tasks:**
1. Design the household data model: location (Saint Lucia community), members
   (adults, children, baby, elderly), special needs (mobility, medical, pets),
   preparedness-state flags per readiness category.
2. Create PostgreSQL tables + migrations (users, households, household members).
3. Build the onboarding form (PRD target: completable in <3 minutes) with large
   touch targets and simple language.
4. Connect the form to the database (create, read, update).

**Dependencies:** Phases 0–1 (running app, DB, authenticated user to own the profile).

**Deliverables:**
- Household tables in PostgreSQL.
- Working onboarding/edit form persisted to the database.

**Verification:**
- Create the PRD sample household (4 people + baby, Castries); save, reload, confirm
  all fields round-trip correctly.
- Update members/needs; confirm changes persist.
- Support PRD household variations (elderly, mobility needs, pets, small business flag).

---

## Phase 3 — Readiness Score (0–100), Checklist, and Next Best Action

**Objective:** Build the core assessment system: a trustworthy 0–100 score computed from
real household preparedness state, with the Next Best Action derived from actual gaps.

**Tasks:**
1. Define the 10 readiness categories (PRD F1): food, water, medical, comms, documents,
   power, home prep, evacuation, contacts, recovery.
2. Define checklist items per category with weights (start from the prototype's
   12-item hurricane & flood plan; e.g. secure windows, clear drains, store water,
   charge devices, protect docs, confirm evacuation route, out-of-island contact).
3. Implement the scoring function `score(household_state) → 0–100` plus per-category
   sub-scores; document the weighting so it is explainable ("Biggest gap is emergency
   communication").
4. Implement gap detection → Next Best Action generator (top 3 prioritized actions,
   personalized by household composition and hazard, e.g. baby/elderly needs first).
5. Persist checklist state per household in PostgreSQL.

**Dependencies:** Phase 2 (household state is the scoring input).

**Deliverables:**
- Versioned scoring logic with documented weights.
- Checklist data model + per-household state storage.
- Gap → Next Best Action generator.

**Verification:**
- Fixture households at 0%, ~50%, 78% (prototype sample), and 100%: scores compute
  as expected and move correctly when items are checked/unchecked (5/12 → 12/12
  raises the score per PRD acceptance criteria).
- For a household missing comms items, the Next Best Action names communication first.
- Score explanation names the true biggest gap in each fixture.

---

## Phase 4 — Home Dashboard Wired to Real Data

**Objective:** Replace the static prototype's hard-coded 78% with the live engine from
Phase 3, keeping the approved visual identity.

**Tasks:**
1. Rebuild the dashboard (score ring, weather/risk banner linking to official sources,
   Next Best Action card, progress line, 6-item navigation, emergency contacts strip)
   on the app framework, styled consistently with `design.html`.
2. Bind every number to backend state (score, progress count, gap text); no hard-coded
   sample values in the shipped UI.
3. Keep responsive behavior (desktop grid → mobile single column + bottom nav) and
   accessibility (skip link, ARIA live regions, ≥44px targets, 16px+ type).

**Dependencies:** Phases 2–3 (profile + score engine). Visual reference: `design.html`.

**Deliverables:**
- Dashboard page reading live household data.
- Responsive + accessible UI matching the approved design.

**Verification:**
- Open locally on desktop and mobile widths; layout matches design, no overlap.
- Check off a checklist item → score ring, progress, and Next Best Action update.
- Lighthouse/accessibility spot-check passes; works with keyboard only.

---

## Phase 5 — Family Emergency Plan

**Objective:** Let households record WHO / WHERE / WHAT-next and retrieve it any time.

**Tasks:**
1. Data model: emergency contacts, meeting point + backup, family roles, comms plan,
   evacuation info — all scoped to the household.
2. CRUD UI + API (large-form, low-stress layout; reuse dashboard styling).
3. Migrate the prototype's `localStorage` plan to PostgreSQL as the source of truth
   (local copy retained only for the Offline Pack, Phase 8).

**Dependencies:** Phases 1–2 (auth + household to attach the plan to).

**Deliverables:**
- Family-plan tables, API, and UI with full create/read/update.

**Verification:**
- Create the sample plan (St. Jude's hall meeting point, Mom/neighbor contacts, Dad/Mom/Gran
  roles); reload → data intact; edit → updates persist.
- A second test household cannot read or modify the first household's plan.

---

## Phase 6 — Smart Supply Planner (EC$)

**Objective:** Turn household size + days into a concrete, priced shopping list.

**Tasks:**
1. Encode the quantities engine: per-person-per-day rates for water, food (+baby food),
   first aid, batteries, hygiene/diapers; Saint Lucia sample prices
   (PRD F4 baseline: 4 people / 3 days = EC$432 itemized).
2. Inputs: people count, days, location; outputs: itemized table + total in EC$.
3. Save named shopping lists per household; link quantities to household profile
   (auto-suggest from member count, including baby/elderly adjustments).

**Dependencies:** Phase 2 (household size/composition inputs).

**Deliverables:**
- Quantities-and-pricing engine with documented rates.
- Supply Planner UI with save/load per household.

**Verification:**
- 1 person / 1 day, 4 people / 3 days (= EC$432 baseline), 6 people / 7 days:
  quantities scale sensibly and totals reconcile with line items.
- Saved list reloads correctly after logout/login.

---

## Phase 7 — Trusted-Source RAG Knowledge Base

**Objective:** Build the grounded knowledge layer the AI must use — before the AI itself
is connected — so unsupported answers are impossible by construction.

**Tasks:**
1. Source governance: confirm the exact approved document set (NEMO Saint Lucia,
   CDEMA, and named official guides — PRD §11 open question; unlicensed material
   is excluded).
2. Ingest pipeline: collect, chunk, and store documents with metadata
   (source, title, date, category: hurricane / flood / shelter / supplies / health).
3. Retrieval function: `retrieve(question, household_context) → ranked passages with
   source citations`; log what was retrieved per query for audit.
4. Adversarial evaluation set: hurricane / shelter / right-now / flooding / emergency-bag
   questions; assert retrieved passages are relevant and that the system refuses to
   answer official-warning questions without a retrieved source.

**Dependencies:** Phase 0 (vector store + ingestion scaffolding). Independent of the
application UI; can run in parallel with Phases 2–6 once Phase 0 lands.

**Deliverables:**
- Versioned knowledge base with source metadata and update cadence documented.
- Retrieval API with citation output and query audit log.
- Evaluation set with pass/fail results.

**Verification:**
- Each test question retrieves passages from the correct approved source.
- A question about live warnings/shelters with no retrieved source → safe refusal
   directing the user to official channels (never an invented answer).
- Removing a source document changes retrieval results accordingly (no stale cache).

---

## Phase 8 — AI Emergency Assistant (RAG + Safety Layer)

**Objective:** Connect the assistant UI to the RAG pipeline and LLM through the Safety
Layer, reproducing the prototype's calm behavior with real grounding.

**Tasks:**
1. Chat UI with the three chips ("What should I do?", "Prepare for hurricane",
   "Find shelter help") + free-text input, reusing dashboard styling.
2. Request flow: user message + household context → Risk Engine inputs → Phase 7
   retrieval → LLM with personalization prompts → Safety Layer (source-presence check,
   banned-content rules: no invented warnings/shelters/evacuation orders/medical
   directives; escalation footer appended).
3. Every response carries: 3 prioritized steps, source-category citation, and the
   official-instructions disclaimer.
4. Replace the prototype's local `ask()/response()` sample logic entirely.

**Dependencies:** Phases 2 (household context), 3 (risk/gap inputs), 7 (retrieval).
This phase must not start until Phase 7's refusal behavior is verified.

**Deliverables:**
- Working assistant backed by RAG + Safety Layer.
- Safety rule set with version history.

**Verification:**
- "Hurricane in 3 days" → securing + supplies + comms/evac steps with NEMO citation.
- "Find shelter help" → packing + family-plan steps + official shelter-list referral
  (no specific shelter claimed as available).
- "What should I do right now?" → alerts + charge + secure + meeting-point steps.
- "Is shelter X open?" / "Should we evacuate now?" → refusal + redirect to officials.
- Each answer shows its source category and disclaimer; audit log records retrieval.

---

## Phase 9 — Offline Emergency Pack (Critical)

**Objective:** Guarantee the essentials work with zero connectivity.

**Tasks:**
1. Define the pack contents: family plan, contacts, checklist state, core instructions,
   saved supply list — capped to PRD budget (<5MB, loads <2s on 3G).
2. Sync engine: on connectivity, download latest pack to IndexedDB/`localStorage`;
   record pack version + timestamp; show "Offline pack saved" state in UI.
3. Service worker: cache app shell + pack for offline load; offline fallback page.
4. Conflict rule: server state wins on reconnect; local edits made offline are flagged
   for review, never silently overwritten (PRD §11 open question — document the choice).

**Dependencies:** Phases 4–6 (dashboard, family plan, supplies provide the pack contents).

**Deliverables:**
- Offline pack with version indicator and storage-size report.
- Service worker + offline fallback.

**Verification:**
- With network disabled (dev-tools offline + a real reload): dashboard, plan,
  contacts, and checklist all open and readable; pack version shown.
- Pack size measured <5MB; cold load <2s on throttled 3G.
- Edit online → reconnect → pack refreshes to the new version.

---

## Phase 10 — Recovery Hub

**Objective:** Support households after an event: document damage, track recovery tasks,
find official assistance.

**Tasks:**
1. Damage records: photo upload (local filesystem) + notes + timestamp, organized
   per household for future assistance/insurance use (organization only — no claims
   filing, per Non-Goals).
2. Recovery checklists + task tracking (add, check off, persist).
3. Official assistance info panel (static links: NEMO, Red Cross Saint Lucia;
   "You're not alone. Help is available." tone).

**Dependencies:** Phases 1–2 (auth + household ownership). Reuses offline patterns
from Phase 9 for field use where feasible.

**Deliverables:**
- Recovery Hub UI + photo/note storage + task management.

**Verification:**
- Add a damage photo + note + checklist item; all persist and redisplay after reload.
- Photos are retrievable per household and invisible to other households.
- Oversized/non-image uploads are rejected with a clear message.

---

## Phase 11 — Business Continuity Stub + Admin / Institutional Functionality

**Objective:** Lay the multi-organization foundation without disturbing households and
without building the deferred full B2B/B2G portal.

**Tasks:**
1. Data model: organizations (business / school / church / hotel / NGO / government
   sponsor) linked to households or standalone; roles: org admin vs. member vs.
   platform admin.
2. Business stub only: organization profile, basic continuity checklist, org-level
   readiness roll-up (household logic reused, clearly labeled experimental).
3. Institutional view: anonymized aggregate metrics only (completed plans, average
   score delta — the PRD §10 pilot metrics); no individual household data visible.
4. Pilot metrics dashboard for the 50–100 household Saint Lucia pilot.

**Dependencies:** Phases 1–3 (auth, households, scoring). Explicitly builds on, never
alters, household behavior.

**Deliverables:**
- Organization data model + stub continuity UI.
- Anonymized institutional metrics dashboard.

**Verification:**
- Sample org with 5 households: roll-up math correct; household features unchanged.
- Institutional account sees aggregates only; direct household-record access denied.
- Pilot dashboard shows completed plans + average score delta from fixture data.

---

## Phase 12 — Safety, Security, and Reliability Review

**Objective:** Prove the system handles emergency information responsibly before any
real-household pilot.

**Tasks:**
1. AI safety re-test: full Phase 8 verification suite re-run against final prompts.
2. Access-control audit: household isolation, org boundaries, admin least-privilege.
3. Input validation + error-handling review across all forms, chat, and uploads.
4. Secrets audit: no passwords, keys, tokens, or private `.env` values in code,
   history, or uploads (same scan used for every prior commit).
5. Privacy check: anonymization of institutional aggregates; child/elder data handling
   documented (PRD §11 open question — record the adopted policy).

**Dependencies:** All of Phases 0–11 (reviews the built system end to end).

**Deliverables:**
- Written safety + security review with findings and fixes.
- Re-run of all phase verification suites (regression pass).

**Verification:**
- Invalid inputs, unauthorized-access attempts, and AI safety probes all behave
  per specification; every finding has a linked fix + retest record.

---

## Phase 13 — Pilot Testing and Iteration (Saint Lucia, 50–100 households)

**Objective:** Validate with real representative users, including elderly and
mobility-needs households (PRD personas).

**Tasks:**
1. Prepare the pilot build + onboarding script (<3 min) + drill guide.
2. Run the pilot; collect completion, score-delta, drill-success, and usability data.
3. Prioritize fixes; implement the top iteration round.

**Dependencies:** Phase 12 sign-off (no real users before the safety review passes).

**Deliverables:**
- Pilot results against the north-star metric (% households with completed + tested plan).
- Prioritized improvement backlog + implemented top fixes.

**Verification:**
- PRD §10 acceptance criteria checked off: onboarding → score + 3 actions; checklist
  completion moves the score; AI answers correct with disclaimers; offline reload works;
  recovery photo/note works; pilot dashboard populated with real numbers.

---

## Phase 14 — Production and Caribbean Expansion Plan (plan only, no build)

**Objective:** Define — but do not execute — the path from local pilot to production
and to additional countries.

**Tasks:**
1. Production architecture: hosted PostgreSQL migration, production auth config,
   secure file storage, monitoring, backups.
2. Localization framework: per-country hazard profiles, currency, locations, and
   source sets (Grenada, St Vincent, Dominica, Antigua, St Kitts, Barbados,
   Trinidad, Jamaica, Bahamas per PRD §6).
3. Deployment, security-testing, performance-testing, and backup/recovery test plans.

**Dependencies:** Phase 13 evidence (expansion priorities informed by pilot results).

**Deliverables:**
- Production readiness + deployment plan.
- Caribbean expansion plan. No deployed system in this phase.

**Verification:** Plans reviewed against PRD NFRs (offline-first, <5MB pack, privacy,
accessibility); no infrastructure is provisioned until a follow-up decision.

---

## How to use this plan

1. Review and approve this document first — no code changes until then.
2. Work phases in order; each phase's Dependencies line is a hard gate.
3. Every phase ends with its Verification steps passing before the next begins
   (the plan's core incremental principle).
4. Resolve PRD §11 open questions at the phase that needs them (source licensing in
   Phase 7, alert/shelter sourcing in Phase 4/8, offline conflicts in Phase 9,
   disclaimers/privacy in Phase 12) and record each answer in the PRD.
