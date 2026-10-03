# IslandReady AI — Trusted-Source Registry (MIXED STATUS — READ CAREFULLY)

**Status:** NEMO/CDEMA candidates below are `pending_permission` / `ingest_allowed: false`
— NOT approved for ingestion. Demo entries in the "Demonstration corpus" section
are IslandReady-authored, `ingest_allowed: true`, and the ONLY ingestible content.
**Rule:** Source permission is an ingestion gate, not a system-development gate.
**Verification basis:** live fetches of official sites on 2026-10-02 (NEMO ok,
CDEMA ok). Every URL below was reached successfully on that date. Anything not
directly observed is marked accordingly — no titles, dates, or terms asserted
from memory.
**Rules (binding once approved):** ingestion accepts only an immutable registry
ID below; unknown publication date ⇒ class (b) minimum; class (c) is
categorically ineligible as safety-critical evidence; historical/operational
material is never treated as current; live shelter lists and current alerts are
never ingested as static knowledge.

## Conventions

- **ID:** immutable (e.g. `NEMO-TIPS-001`). Never reused; superseded entries keep
  their rows with status `retired`.
- **Class:** (a) evergreen guidance · (b) dated/versioned guidance · (c) operational,
  never safety evidence · (x) explicitly excluded.
- **License of NEMO site content:** footer states "Copyright 2026 by Saint Lucia
  NEMO | All Rights Reserved" with a [Terms Of Use](https://nemo.gov.lc/Terms) page.
  Formal reuse terms are therefore **unconfirmed** — the Terms page must be reviewed
  and reuse explicitly approved before any NEMO text is ingested.
- **License of CDEMA site content:** no license statement observed on fetched pages —
  **unconfirmed**; same review requirement.

## Candidate entries (ingestion NOT authorized)

### NEMO-TIPS-001 — NEMO "To Do Checklist" page + linked preparedness downloads
- **Title (observed):** "To Do Checklist" (page) + downloads: "Disaster Planning
  Shopping List" (44.05 KB), "Family Disaster Supplies Calendar" (43.00 KB),
  "Make the Right Connections" (2.53 MB).
- **Publisher:** NEMO Saint Lucia. **URL (verified live):** https://nemo.gov.lc/Tips/To-Do-Checklist
- **Publication/update date:** not shown on page — **unknown** ⇒ class (b) minimum
  per rules (eligible for upgrade to (a) only if the documents themselves carry a
  confirmed date/version at ingestion review).
- **Version:** unconfirmed. **License:** unconfirmed (see Terms requirement above).
- **Category:** hurricane / supplies / home-prep. **Class:** (b).
  **Time-sensitive:** no (how-to content, but undated).
  **Safety-critical eligible:** only after date/version confirmation; until then it
  may support answers **with** an explicit "undated NEMO guidance, retrieved
  2026-10-02" citation, never as sole evidence for a safety-critical claim.
- **Reason:** launch-market authority for household checklists, shopping lists,
  supply rotation ("rotate perishables, change water every six months" observed).

### NEMO-NEMP-001 — National Emergency Management Plan materials
- **Title:** National Emergency Management Plan — General Info, Policy Documents,
  Guidelines, SOPs, National/Sector Plans (section index observed; individual
  document titles/dates NOT yet opened).
- **Publisher:** NEMO Saint Lucia.
  **URL (verified live):** https://nemo.gov.lc/Disaster-Management/National-Emergency-Management-Plan/General-Info
- **Date/version:** unconfirmed (individual documents unopened). **License:** unconfirmed.
- **Category:** plans. **Class:** (b). **Time-sensitive:** yes (versioned plans).
  **Safety-critical eligible:** only with version/date stated inline.
- **Reason:** answers "what does the Saint Lucia plan say" (class-B questions).
  Requires opening each document and recording its version before any ingestion.

### NEMO-HAZ-001 — Hazard Information page
- **Title:** "Hazard Information" (section page observed; article-level content NOT opened).
- **Publisher:** NEMO Saint Lucia.
  **URL (verified live):** https://nemo.gov.lc/Disaster-Management/Hazards/Hazard-Information
- **Date/version/license:** all unconfirmed. **Category:** hurricane / flood / landslide.
  **Class:** (b) minimum. **Time-sensitive:** partial.
  **Safety-critical eligible:** only after content/date review.
- **Reason:** Saint Lucia-specific hazard descriptions for preparedness answers.

### NEMO-REC-001 — Recovery Info + Relief & Aid pages
- **Titles:** "Recovery Info"; "Apply for Assistance" (relief/aid application guidance observed).
- **Publisher:** NEMO Saint Lucia.
  **URLs (verified live):** https://nemo.gov.lc/Disaster-Management/Recovery-Info and
  https://nemo.gov.lc/Disaster-Management/Relief-Aid/Apply-for-Assistance
- **Date/version/license:** unconfirmed. **Category:** recovery.
  **Class:** (b). **Time-sensitive:** partial (assistance procedures change).
  **Safety-critical eligible:** only with date stated; never for live aid availability.
- **Reason:** Phase 10-adjacent recovery guidance and official assistance routing.

### NEMO-SHELTER-OPS-01 — NEMO Shelter Listing page (OPERATIONAL — class c)
- **Title:** "Shelter Listing" (link observed on homepage; listing content NOT opened).
- **Publisher:** NEMO Saint Lucia. **URL (verified live):** https://nemo.gov.lc/Shelter-Listing
- **Date/version:** n/a (operational listing). **Category:** shelter.
  **Class:** (c). **Time-sensitive:** yes. **Safety-critical eligible:** NEVER —
  per approved amendment, the shelter listing is dated/operational information,
  categorically ineligible as safety evidence regardless of score, and must never
  answer "is shelter X open" or "which shelters are open."
- **Reason for registry presence:** documented so the classifier routes all
  shelter-status questions to refusal + official channels. Ingestion (if ever
  authorized) is for routing context only, never evidence.

### CDEMA-HURR-001 — CDEMA Hurricane Season preparedness page
- **Title:** Hurricane Season page ("Are you hurricane ready" campaign asset observed).
- **Publisher:** CDEMA. **URL (verified live):** https://www.cdema.org/index.php/hurricane-season
- **Date/version/license:** unconfirmed. **Category:** hurricane. **Class:** (b) minimum.
  **Time-sensitive:** no (campaign how-to, but undated).
  **Safety-critical eligible:** only after date confirmation; corroborating source to NEMO.
- **Reason:** regional-authority corroboration for hurricane prep answers. Historical
  CDEMA material is classified by content/version, never auto-evergreen by publisher.

### CDEMA-CDM-001 — Comprehensive Disaster Management (CDM) concept pages
- **Title:** CDM concept material (observed on cdema.org CDM pages; household-level
  guidance value unconfirmed).
- **Publisher:** CDEMA. **URL (verified live):** https://cdema.org/index.php/cdm
- **Date/version/license:** unconfirmed. **Category:** concepts.
  **Class:** (b) minimum, pending content review; likely EXCLUDED if no household
  preparedness guidance is found (programmatic content, not household how-to).
- **Reason:** candidate only; content review decides include vs exclude.

## Explicitly EXCLUDED (documented so retrieval can never claim them)

| ID | What | Why excluded |
|---|---|---|
| X-NEMO-PAST | NEMO "Past Hazards" page + any historical storm reports | Historical material must never be presented as current; perfect adversarial-test material instead |
| X-CDEMA-SITREP | CDEMA Situation Reports / Information Notes (e.g. Hurricane Melissa 2025 series, observed live) | Time-sensitive operational reporting; ingesting it would let stale operations masquerade as current status |
| X-CDEMA-NEWS | CDEMA News / Press Releases | News, not guidance; dated by nature |
| X-NEMO-NEWS | NEMO News section | Same as above |
| X-LIVE-ALERTS | Any live alert feed, warning feed, or social-media stream | Current-status questions must refuse/redirect, never consult static copies |
| X-MOH-BOILWATER | Saint Lucia Ministry of Health boil-water/food-safety document | **Not yet located or verified**: https://health.gov.lc/ was unreachable from here on 2026-10-02. Per instruction, it stays OUT of the registry until its exact title, URL, date, and terms are verified from the official source |

## Demonstration corpus (IslandReady-authored — ingest_allowed: true)

Every passage below is labeled, verbatim: **"IslandReady AI demonstration
content — NOT official government guidance."** These exist to prove the RAG
pipeline (registration, metadata, ingestion, chunking, embeddings, retrieval,
attribution, freshness, audit, removal, evidence checks, refusal). They must
never be presented as NEMO, CDEMA, government, or medical authority, and no
passage makes claims about any actual current emergency.

| ID | Topic | Class | Notes |
|---|---|---|---|
| IR-DEMO-HOME-01 | hurricane home preparation | (a)-demo | shutters, yard items, drains |
| IR-DEMO-WATER-01 | drinking-water storage | (a)-demo | 1 gal/person/day, rotation |
| IR-DEMO-FOOD-01 | food storage incl. baby food | (a)-demo | 3-day supply, opener |
| IR-DEMO-COMMS-01 | radio + phone tree + out-of-island contact | (a)-demo | comms planning |
| IR-DEMO-SHELTER-01 | general shelter-packing list | (a)-demo | what to bring; no specific shelter named |
| IR-DEMO-RIGHTNOW-01 | hypothetical right-now response pattern | (a)-demo | explicitly hypothetical; never live operational evidence |
| IR-DEMO-FLOOD-01 | drains, gutters, flood prep | (a)-demo | yard flooding prevention |
| IR-DEMO-AFTER-01 | general post-storm safety steps | (a)-demo | debris, utilities, official help routing |
| IR-DEMO-STALE-01 | superseded seasonal guidance, version 1, dated 2023 | (b)-demo | tests date/version awareness; never sole safety evidence |
| IR-DEMO-INJECT-01 | preparedness text containing an embedded instruction | (a)-demo text, adversarial fixture | tests that document content is treated as data, never instructions |

Full texts: `db/seeds/006_demo_corpus.json` (version 1, retrieved-date stamped at ingest).

## Approval block (do not ingest NEMO/CDEMA before all boxes are checked)

- [ ] Each (b)-candidate's date/version confirmed from the document itself or kept at (b)-with-undated-citation
- [ ] NEMO Terms Of Use reviewed; reuse explicitly approved (or entries stay un-ingestible)
- [ ] CDEMA reuse terms confirmed (or entries stay un-ingestible)
- [ ] MOH document verified or stays excluded
- [ ] Owner approval recorded with date
