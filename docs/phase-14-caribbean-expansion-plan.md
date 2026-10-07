# Phase 14 — Caribbean Expansion Plan (localization framework, planning only)

**Status labels:** ✅ **BUILT NOW** · 📋 **PLANNED** · 🧪 **REQUIRES REAL-WORLD PILOT EVIDENCE** ·
📝 **REQUIRES EXTERNAL PERMISSION**

> Framework + placeholders only. No source content is ingested, no permission is
> claimed, and no per-country behavior is built. Currencies below are public
> ISO facts used as framework defaults (re-validate at build time). Hazard
> sketches are DRAFT prompts for in-country validation, not authoritative
> profiles. Every "trusted authority / source set" row is a CANDIDATE list —
> ingestion 📝 REQUIRES written permission; today the app answers from the
> labeled demo corpus only.

## 1. What already generalizes (✅ BUILT NOW)

- `households.country` discriminator (default `'Saint Lucia'`,
  `db/migrations/000_households.sql`) — new countries are data + catalog rows,
  not schema changes.
- Supply engine is currency-agnostic (integer cents, per-catalog pricing);
  EC$/XCD is a property of the v1 Saint Lucia catalog rows, not the code
  (`db/migrations/005_supplies.sql`, `src/lib/supplies.ts`).
- Checklist/readiness engine is data-driven (categories/items/weights from DB);
  per-country hazard checklists ship as new seed rows + weights version.
- RAG retrieval is source-set driven (`src/lib/rag/*`); swapping/adding a
  country's approved corpus is a data operation behind the same safety layer.
- Org model already supports multi-cohort rollouts (schools/churches/businesses
  per country); institutional metrics stay aggregates-only with n≥5 suppression.

## 2. Per-country localization record (framework fields)

Each country gets one record with these fields; values below are STARTER
placeholders — every row ships with `status: draft` until validated in-country
(🧪 pilot evidence) and sources cleared (📝 permission).

Fields: `hazard_profile` · `currency` · `locations_regions` · `candidate_authorities`
· `source_set_status` · `localization_notes` · `readiness_notes`

### 2.1 Saint Lucia (launch market — reference implementation, ✅ BUILT NOW)

- `hazard_profile` (draft): hurricanes/tropical storms, flooding, landslides,
  storm surge; seasonal preparedness calendar per NEMO guidance (to be confirmed).
- `currency`: XCD (EC$) — live in v1 catalog.
- `locations_regions`: communities free-text today; Castries + rural split used
  for pilot sampling (Phase 13 plan).
- `candidate_authorities`: Saint Lucia NEMO; CDEMA (regional); national Met Service.
- `source_set_status`: 📝 PENDING — demo corpus only; NEMO/CDEMA ingestion blocked
  on written permission (`docs/kb_sources.md`, `docs/kb_permission_requests.md`).
- `localization_notes`: English; EC$ formatting; Castries/urban vs rural outreach.
- `readiness_notes`: pilot target 52 households; results ⏳ pending.

### 2.2 Grenada — 📋 PLANNED (`status: draft`)

- `hazard_profile` (draft): hurricanes, flooding, landslides, storm surge; seismic/regional volcanic ashfall awareness (validate in-country).
- `currency`: XCD (EC$) — same engine, new catalog price rows if local pricing differs.
- `locations_regions`: TBD — parishes (St George's + outer parishes), to confirm.
- `candidate_authorities`: Grenada NaDMA; CDEMA; regional Met Service — 📝 written permission required before any ingestion.
- `source_set_status`: 📝 NOT REQUESTED YET.
- `localization_notes`: English; parish structure; fishing/agriculture livelihoods.
- `readiness_notes`: 🧪 pilot evidence from Saint Lucia determines sequencing.

### 2.3 Saint Vincent and the Grenadines — 📋 PLANNED (`status: draft`)

- `hazard_profile` (draft): hurricanes + **volcanic (La Soufrière)**,
  floods/landslides, storm surge, seismic (validate in-country).
- `currency`: XCD (EC$).
- `locations_regions`: TBD — mainland + Grenadine islands (inter-island comms/ferry dependence), to confirm.
- `candidate_authorities`: NEMO St Vincent; CDEMA; volcano observatory bulletins (via official channels) — 📝 permission required.
- `source_set_status`: 📝 NOT REQUESTED YET.
- `localization_notes`: volcanic-evacuation content needs observatory-sourced wording; multi-island logistics.
- `readiness_notes`: 🧪 sequencing after Saint Lucia pilot.

### 2.4 Dominica — 📋 PLANNED (`status: draft`)

- `hazard_profile` (draft): hurricanes, flash flooding, landslides, storm surge; seismic (validate in-country).
- `currency`: XCD (EC$).
- `locations_regions`: TBD — Roseau + rural/coastal villages, Kalinago Territory considerations, to confirm.
- `candidate_authorities`: Dominica ODM; CDEMA — 📝 permission required.
- `source_set_status`: 📝 NOT REQUESTED YET.
- `localization_notes`: English + Kwéyòl outreach considerations; rugged terrain comms.
- `readiness_notes`: 🧪 sequencing after Saint Lucia pilot.

### 2.5 Antigua and Barbuda — 📋 PLANNED (`status: draft`)

- `hazard_profile` (draft): hurricanes, drought/water scarcity, flooding, storm surge; Barbuda's low-lying exposure (validate in-country).
- `currency`: XCD (EC$).
- `locations_regions`: TBD — Antigua + Barbuda two-island split, to confirm.
- `candidate_authorities`: NODS Antigua & Barbuda; CDEMA — 📝 permission required.
- `source_set_status`: 📝 NOT REQUESTED YET.
- `localization_notes`: water-storage emphasis; two-island coordination.
- `readiness_notes`: 🧪 sequencing after Saint Lucia pilot.

### 2.6 Saint Kitts and Nevis — 📋 PLANNED (`status: draft`)

- `hazard_profile` (draft): hurricanes, flooding, storm surge; volcanic awareness (Nevis Peak dormant — validate framing in-country).
- `currency`: XCD (EC$).
- `locations_regions`: TBD — two-island federation, to confirm.
- `candidate_authorities`: NEMA St Kitts & Nevis; CDEMA — 📝 permission required.
- `source_set_status`: 📝 NOT REQUESTED YET.
- `localization_notes`: federal two-island coordination; tourism-sector continuity.
- `readiness_notes`: 🧪 sequencing after Saint Lucia pilot.

### 2.7 Barbados — 📋 PLANNED (`status: draft`)

- `hazard_profile` (draft): hurricanes, flooding, storm surge/coastal erosion; water scarcity (validate in-country).
- `currency`: BBD (Bds$) — first non-XCD catalog: new price rows + currency label; engine unchanged.
- `locations_regions`: TBD — parishes, Bridgetown vs coastal/rural, to confirm.
- `candidate_authorities`: Barbados DEM; CDEMA; Barbados Met Service — 📝 permission required.
- `source_set_status`: 📝 NOT REQUESTED YET.
- `localization_notes`: Bds$ formatting; dense urban + coastal exposure.
- `readiness_notes`: 🧪 sequencing after Saint Lucia pilot.

### 2.8 Trinidad and Tobago — 📋 PLANNED (`status: draft`)

- `hazard_profile` (draft): flooding/landslides dominant, storm surge; hurricanes
  less frequent but in-season risk; seismic (validate in-country).
- `currency`: TTD (TT$) — new catalog price rows + label; engine unchanged.
- `locations_regions`: TBD — Trinidad + Tobago, urban flood zones, to confirm.
- `candidate_authorities`: ODPM Trinidad & Tobago; CDEMA; TT Met Service — 📝 permission required.
- `source_set_status`: 📝 NOT REQUESTED YET.
- `localization_notes`: flood-first checklist weighting differs from hurricane-first islands; largest population = scale test for aggregates.
- `readiness_notes`: 🧪 sequencing after Saint Lucia pilot.

### 2.9 Jamaica — 📋 PLANNED (`status: draft`)

- `hazard_profile` (draft): hurricanes, flooding/landslides, storm surge; seismic/earthquake awareness (validate in-country).
- `currency`: JMD (J$) — new catalog price rows + label; engine unchanged.
- `locations_regions`: TBD — parishes, Kingston metro vs rural/mountain, to confirm.
- `candidate_authorities`: ODPEM Jamaica; CDEMA; Jamaica Met Service — 📝 permission required.
- `source_set_status`: 📝 NOT REQUESTED YET.
- `localization_notes`: earthquake content is new hazard coverage; Patois/English outreach; largest pilot-scale jump.
- `readiness_notes`: 🧪 sequencing after Saint Lucia pilot.

### 2.10 Bahamas — 📋 PLANNED (`status: draft`)

- `hazard_profile` (draft): hurricanes + storm surge dominant across low-lying
  islands/cays; flooding; (validate in-country).
- `currency`: BSD (B$) — new catalog price rows + label; engine unchanged.
- `locations_regions`: TBD — multi-island archipelago (New Providence + Family Islands), to confirm.
- `candidate_authorities`: NEMA Bahamas; CDEMA; Bahamas Met Department — 📝 permission required.
- `source_set_status`: 📝 NOT REQUESTED YET.
- `localization_notes`: archipelago logistics; surge/evacuation content prominent; Family-Islands connectivity constraints favor offline pack.
- `readiness_notes`: 🧪 sequencing after Saint Lucia pilot.

## 3. Expansion sequencing (🧪 pilot-gated)

1. Complete Saint Lucia 52-household pilot; record real results (Phase 13 plan).
2. Run one iteration round on the prioritized backlog.
3. Select next 1–2 countries by: pilot-validated demand, permission progress
   (📝), and catalog cost (XCD islands first — no currency work; then BBD/TTD/JMD/BSD).
4. Per country: validate hazard profile in-country → secure source permission →
   author catalog/checklist seed rows → translate/localize strings → org-cohort
   rollout → country pilot → merge backlog.

## 4. Explicit non-claims

- No NEMO/CDEMA or any national-agency content is licensed, ingested, or quoted
  beyond the labeled demo corpus. All source rows above are candidates.
- No hazard profile above is authoritative. Each requires in-country validation.
- No expansion order beyond Saint Lucia-first is committed; sequencing follows
  🧪 pilot evidence.
