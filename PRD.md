# IslandReady AI — Product Requirements Document (Starter PRD)

**Version:** 0.1 Starter — 2026-09-26
**Sources:** `IslandReady AI document.docx`, `IslandReady_AI_Pitch_Deck-3.pptx`, `IslandReady_AI_Prototype-5.html`
**Tagline:** Be Prepared. Stay Safe. Build a Stronger Tomorrow.

## 1. Overview / Problem

Caribbean-first AI disaster preparedness, response and recovery platform. Launch market: **Saint Lucia**, then OECS / Caribbean.

Problem:
- Recurring hurricanes, floods, landslides, droughts; ~half Saint Lucia population within 5km of coastline (World Bank).
- Emergency info fragmented across websites, WhatsApp, Facebook, government docs.
- Families can't turn alerts into a practical plan; need next safe action, not a 30-page checklist.
- Small businesses lack continuity/recovery tools.

Product vision: Every Caribbean household can answer: **WHO do I contact? WHERE do we go? WHAT do we do next?**

Example magic moment:
> Hurricane may affect Saint Lucia in 3 days. Household of 4 incl. baby asks "What should we do?" → IslandReady builds 72-hr plan, finds missing supplies, assigns roles, creates comms plan, gives calm source-grounded next actions, keeps plan offline.

## 2. Goals / Non-Goals

### Goals (MVP - 90 days, 50-100 household pilot in Saint Lucia)
- Household creates profile → gets Readiness Score 0-100% + top 3 next actions.
- AI Assistant personalizes trusted guidance (NEMO/CDEMA) for household composition.
- Family plan + supply list in EC$ + offline emergency pack usable without internet.
- Measure: % households with completed + tested plan (north-star), readiness-score improvement, plan completion, drill success.

### Non-Goals (MVP)
- No real-time official alerting ingestion; link to / defer to official alerts.
- No live shelter availability; provide static guidance + direct to official shelter list.
- No insurance claims filing integration; only damage photo/notes organization.
- No full B2B/B2G portal; only基础 business continuity mode stub.

## 3. Users / Personas

1. **Family lead (e.g., mother in Castries, 2 kids + grandmother)** — needs prioritized actions, family roles.
2. **Elderly / mobility-needs / caregiver households** — needs simplified steps, coordination.
3. **Small business / school / church / hotel** (post-MVP) — needs continuity plan, drills, readiness score.
4. **NGO / Government sponsor** — needs community deployment, aggregate readiness insights (anonymized).

Household variations to support: 2 adults, 4 adults, children, elderly, pets, mobility needs, small business, limited supplies.

## 4. MVP Scope — 6 Core Features (from prototype)

### F1. Home Dashboard + Readiness Score
- Score 0-100% across: food, water, medical, comms, documents, power, home prep, evacuation, contacts, recovery.
- Show: score ring (proto: 78%), weather & risk status banner, Next Best Action card.
- Instead of "prepare", show: "You're 78% ready. Biggest gap is emergency communication."
- Progress: e.g., "Hurricane & flood plan · 5 of 12 complete".

### F2. AI Emergency Assistant (RAG + Safety Layer)
- Q&A with chips: "What should I do?", "Prepare for hurricane", "Find shelter help".
- Behavior in prototype:
  - hurricane → secure windows/doors, water/food/meds/radio/batteries, charge, comms/evac plan + "follow official alerts".
  - shelter → packing + family plan + refer to official authority list.
  - right-now → check alerts, charge devices, secure items, confirm meeting point.
- Requirements:
  - Retrieval-Augmented Generation over approved NEMO/CDEMA/guides; never invent safety-critical advice.
  - Safety layer: rules, source checks, escalation ("follow official instructions, don't rely solely on app").
  - Personalization inputs: household size, hazard, what they have.

### F3. Family Emergency Plan
- Fields: emergency contacts (Mom/Dad/Sister/Neighbor), meeting point (e.g., St. Jude's Church · Castries), family roles (check relatives, collect supplies, monitor updates), comms + evacuation plan.
- Actions: Save family plan (proto uses alert stub → replace with localStorage + backend).

### F4. Smart Supply Planner (EC$)
- Inputs: people count, days, location (Saint Lucia).
- Example for 4 people / 3 days: Water EC$72, Food EC$150, First aid EC$65, Flashlight/batteries EC$40, Radio EC$60, Hygiene EC$45.
- Actions: Save shopping list; future: retailer integration.

### F5. Offline Emergency Pack (Critical)
- Must work with no internet: family plan, contacts, checklist, instructions, saved info.
- Pattern: cloud provides intelligence when available; phone retains essential pack (localStorage / IndexedDB + PWA service worker in full build).

### F6. Recovery Hub
- After event: "You're not alone. Help is available."
- Photograph damage + notes, organize evidence, recovery checklist, official assistance info, task tracking.
- Future: insurance/claims ecosystem.

## 5. Functional Requirements (MVP user stories)

- As household, I can onboard (location, household members, needs) in <3 min so I get a score.
- As user, I see Readiness Score + Next Best Action ("Charge power banks and secure loose outdoor items") → Start now → Checklist.
- As user, I can check off preparedness items (Secure windows, Clear drains, Prepare supplies, Charge devices, Protect docs, Confirm evacuation route) and see progress bar update.
- As user, I can ask AI free-text and get 3 prioritized steps + disclaimer.
- As family, I can add contacts/meeting point/roles and save.
- As user, I can generate supply list by household size/days and save.
- As user, I can access saved plan offline.

Acceptance: all flows work in `IslandReady_AI_Prototype-5.html` click-path: Home ↔ Get Ready / AI / Family Plan / Supplies + bottom nav.

## 6. Non-Functional Requirements

- Mobile-first (proto: 440px app shell), PWA-ready, low-bandwidth.
- Offline-first: essential pack <5MB, loads <2s on 3G.
- Safety/trust: every AI answer cites trusted source category; escalation footer; no autonomous evacuation orders.
- Localization: Saint Lucia hazards, EC$, Castries example locations; extensible to Grenada, St Vincent, Dominica, Antigua, St Kitts, Barbados, Trinidad, Jamaica, Bahamas.
- Privacy: household data private by default; anonymized aggregates only for institutional view.
- Accessibility: large buttons, simple language, calm tone.

## 7. Technical Architecture (proposed)

User → Household Profile (location/family/needs/preparedness) → Risk Engine (hazard+region, vulnerability, readiness) → Trusted Source RAG (NEMO/CDEMA/approved guides) → AI Engine (LLM + prompts, personalization) → Safety Layer (rules, source checks, escalation) → IslandReady AI "Next Best Action".

Stack suggestion for course MVP: static PWA + backend (auth, DB for profile/plans) + vector store for RAG + LLM API. Prototype is pure HTML/CSS/JS with `show()/home()/ask()/response()` — replace stubs with real APIs in Weeks 5-6.

## 8. Business Model (context, not MVP build)

- FREE: score, basic plan, checklist, contacts.
- FAMILY PLUS $4.99/mo or $49/yr: AI planning, scenarios, supply planner, offline pack, sharing.
- FAMILY PRO $9.99/mo or $99/yr: multi-household, secure sharing, recovery tools.
- BUSINESS $19-$49+/mo: continuity plans, drills, business score.
- B2G/NGO: annual licensing + sponsored deployments ("powered for 10,000 households by [partner]").

Flywheel: households → readiness data → community insights → institutional contracts → free community access → more households.

## 9. 90-Day MVP Milestones (from deck/doc)

- Wks 1-2: research + source governance, brand, interviews, requirements.
- Wks 3-4: auth + household profile + readiness engine + checklist.
- Wks 5-6: RAG AI assistant + knowledge base.
- Wks 7-8: family plan + supply planner + offline pack.
- Wks 9-10: recovery + business mode stub.
- Wks 11-12: pilot 50-100 households + evidence + iteration.

Go-to-market: pilot → community/school/employer/NGO partners → drills/challenges → measure score improvement → institutional contracts → localize.

## 10. Acceptance Criteria for Starter MVP Done

- [ ] Onboard 4-person + baby household, get score + 3 actions.
- [ ] Complete checklist 5/12 → 12/12 updates score.
- [ ] AI answers hurricane/shelter/now correctly with official-source disclaimer.
- [ ] Save/load family plan + supply list; persists offline after reload with no network.
- [ ] Recovery: add damage photo + note + checklist item.
- [ ] Pilot metrics dashboard: completed plans, avg score delta.

## 11. Open Questions / Risks

- Which exact NEMO/CDEMA docs licensed for RAG? Update cadence?
- Official alert + shelter list APIs or manual links?
- Offline conflict resolution? Medical disclaimer wording?
- Data residency + child/elder privacy?
- Competitors (Perci, Crisis Path, Kapit Kamay) — differentiation sustained via Caribbean-first + partnerships?
- Revenue vs free access balance for vulnerable households?

---
*Next: turn §5 stories into issues, attach prototype screens, confirm RAG source list.*

## Technical Decision Notes

### Database Choice — PostgreSQL

For IslandReady AI, PostgreSQL was considered alongside SQLite.

SQLite would provide a simpler setup for a small local prototype. However, IslandReady AI is intended to support multiple households and eventually businesses, schools, hotels, NGOs, and institutional users.

IslandReady AI is designed to eventually support multiple households, businesses, schools, hotels, NGOs, and institutional users, so PostgreSQL provides a stronger relational foundation for the application's current data requirements and future expansion, so I decided to use PostgreSQL

The application and database will run locally during the initial development stage.

## Design Refinement Notes

### Primary Button Contrast and Readability

The initial IslandReady AI design preview was created in `design.html`.

I asked the AI builder to make one specific refinement: improve the contrast and readability of the primary call-to-action button.

The button was updated to have stronger visual contrast against its background, clearer text, a stronger visual hierarchy, and a defined hover state.

The purpose of this refinement is to make important actions easier to identify and use, particularly when a user may be accessing the application during a stressful emergency situation.

The overall IslandReady AI color palette and page layout were kept unchanged.

## Implementation Progress

IslandReady AI has reached the **Initial Working Prototype** phase.

The first working application page is being implemented as the IslandReady AI dashboard/home page. This prototype demonstrates the main product direction, including the Readiness Score, Next Best Action, preparedness checklist, AI Emergency Assistant area, navigation, and emergency contact information.

The application is being developed and tested locally in the browser. The visual design preview in `design.html` was used as a reference for the working prototype.

### What Comes Next

According to the implementation roadmap, the next stages are to build the underlying functionality for:

1. Household Profile and User Data

2. Readiness Score and Preparedness Checklist

3. Family Emergency Plan

4. Smart Supply Planner

5. AI Emergency Assistant

6. Trusted Sources and RAG

7. Offline Emergency Pack

8. Recovery Hub

These features will be developed incrementally and tested locally before moving toward the later production and expansion stages.
 
