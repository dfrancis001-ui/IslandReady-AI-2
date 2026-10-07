# IslandReady AI Saint Lucia Pilot — Pilot Plan (Phase 13)

**Status labels used in this document:**
- ✅ **BUILT** — implemented, tested, committed in the application.
- 🟡 **READY FOR PILOT** — prepared and waiting for real participants.
- ⏳ **ACTUAL PILOT DATA** — real participant results (none collected yet; all tables below are empty by design).
- 🔲 **NOT YET COMPLETED** — explicitly pending real-world execution.

## A. Pilot overview

- **Pilot name:** IslandReady AI Saint Lucia Pilot
- **Target:** **52 households** (within the planned 50–100 range).
- **Purpose:** Validate with real representative Saint Lucian households — including elderly and mobility-needs households per PRD personas — that IslandReady AI turns alerts into a practical, calm, personal preparedness plan.
- **Duration placeholder:** 4 weeks (2 weeks onboarding + use, 1 week drill week, 1 week survey + iteration). Adjust before launch.
- **Participant eligibility:** Saint Lucia resident household; at least one adult smartphone user; informed consent (see Privacy); purposive sampling to include: families with children/babies, elderly-only households, mobility-needs households, at least 2 small businesses (continuity stub), urban (Castries) + rural communities.
- **Pilot objectives:**
  1. ≥80% of onboarded households complete a readiness assessment (score generated).
  2. ≥60% complete a family emergency plan.
  3. Usability: median ease-of-use rating ≥4/5; readiness score understood by ≥80%.
  4. Zero safety incidents attributable to app guidance; all AI answers carry sources + disclaimers.
  5. Collect prioritized improvement backlog for one iteration round.

## B. Participant onboarding (all steps ✅ BUILT, 🟡 READY FOR PILOT)

1. Facilitator explains purpose + consent/privacy acknowledgement (paper or verbal script — template to be finalized pre-launch; data stays in the local pilot database, anonymized aggregates only for reporting).
2. Household signs up in-app (<3 min target): account → household profile (community, members incl. baby/elderly/mobility/pets flags) → automatic Readiness Score + top-3 Next Best Actions.
3. Facilitator confirms the household can state its score and first action before leaving onboarding.

## C. Pilot test scenarios (each maps to a ✅ BUILT feature)

1. **Hurricane approaching (3 days out):** ask the AI assistant, complete the hurricane checklist items, confirm meeting point.
2. **Flood preparation:** clear-drains/home-prep items, store water, protect documents.
3. **Emergency bag:** supply planner for own household size (defaults to household size, 4 if unknown), save the list.
4. **Family communication/evacuation:** create the family plan (contacts, roles, meeting point, comms plan); run a 10-minute tabletop drill.
5. **Supply planning:** generate, save, and reload a second list for a different household size.
6. **Offline emergency information:** save the offline pack, enable airplane mode, reload dashboard/plan/contacts from the pack.
7. **Recovery after an incident:** add a damage note + photo + recovery task; check assistance info.

## D. Feedback survey (max 10 questions — administer post-drill week)

Scale: 1 (strongly disagree) – 5 (strongly agree), unless noted.
1. The app was easy to use.
2. I understood what my Readiness Score means.
3. The Next Best Action told me clearly what to do first.
4. The AI assistant's answers were useful and trustworthy.
5. The Family Emergency Plan feature helped my household get organized.
6. The Supply Planner (EC$) was useful for my household size.
7. I could access my essential information offline.
8. After using IslandReady AI, my household feels more prepared for a hurricane/flood. (confidence)
9. Overall preparedness rating, 1–10 (single number).
10. Open-ended: "What one improvement would help your household most?"

## E. Pilot metrics (definitions; values ⏳ PENDING — do not fill without real data)

| # | Metric | Source |
|---|---|---|
| 1 | Households onboarded (target 52) | signup count |
| 2 | Households with readiness assessment (score generated) | score API usage |
| 3 | Households completing family plans | family_plans rows |
| 4 | Households using supply planner (saved lists) | supply_lists rows |
| 5 | Households using AI assistant (≥1 question) | kb_query_log distinct households |
| 6 | Households testing offline pack (pack sync events / offline page views) | app logs |
| 7 | Survey completion rate | returned surveys / 52 |
| 8 | Average usability rating (Q1) + confidence (Q8–9) | survey |
| 9 | Common issues reported | survey Q10 + support log |

North-star: % households with a completed + drill-tested plan. Existing aggregate endpoint (`/api/institutional/metrics`, platform-admin only, n≥5 suppression) already reports pilot-scale numbers without exposing household PII — reuse it; no new dashboard needed.

## Privacy/safety considerations

- Household data private by default; pilot reporting uses anonymized aggregates only (existing n≥5 suppression).
- No real-time alerts inside the app; participants are briefed to follow official NEMO/CDEMA channels; the app never issues evacuation orders.
- Children/elderly data: collect minimum necessary; facilitator-supervised onboarding for vulnerable participants.
- Photos/notes stay in the pilot database; delete on participant withdrawal request.

## Pilot completion criteria

52 households onboarded → ≥80% assessed → drill week executed → survey collected → backlog prioritized → one iteration round implemented → results recorded in this document (Section E filled with REAL numbers only).

## Expansion path (52 → 50–100+)

52 validates the workflow; scale by adding communities/schools/churches as organization cohorts (existing org model), reusing the same scenarios/survey; institutional metrics already aggregate across cohorts. Caribbean expansion per-country work remains Phase 14.

---
*Phase 13 status: workflow + documentation ✅ BUILT and 🟡 READY FOR PILOT. No actual participant data exists. Phase 13 is NOT empirically complete.*
