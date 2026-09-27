# IslandReady AI 🏝️

> Be Prepared. Stay Safe. Build a Stronger Tomorrow.

IslandReady AI is a Caribbean-first AI disaster preparedness, response, and recovery platform. It turns scattered emergency information into a personalized plan: a readiness score, a next best action, a family plan, a localized supply list, and an offline emergency pack.

**Status:** Early prototype (v0.1) — interactive HTML mockup + pitch deck + concept doc.
**Launch market:** Saint Lucia, expanding to OECS / Caribbean.

---

## What it does

A family hears a hurricane may affect Saint Lucia in 3 days. Instead of searching websites, WhatsApp, Facebook, and government PDFs, they open IslandReady AI and see:

- **Readiness Score: 78%** — with the biggest gap called out
- **Next best action:** "Charge power banks and secure loose outdoor items."
- A personalized 72-hour plan for their household

Example query:

> "We are four people and have a baby. What do we need to do?"

IslandReady AI builds a household-specific plan, lists missing supplies in EC$, assigns family roles, and keeps the essential plan available offline.

Current prototype screens (`doc/IslandReady_AI_Prototype-5.html`):

- Home Dashboard (score + weather/risk alert + next action)
- Preparedness Checklist (hurricane & flood, 5/12 complete)
- AI Emergency Assistant (simulated rule-based responses)
- Family Emergency Plan (contacts, meeting point, roles)
- Smart Supply Planner (4 people / 3 days, EC$ estimates)

## Who it is for

- **Households & families** in Saint Lucia / Caribbean — especially with children, elderly relatives, pets, mobility needs, or limited supplies
- **Caregivers** coordinating multiple households
- **Small businesses, hotels, schools, churches, NGOs** needing continuity plans, drills, and readiness scores
- **Governments, insurers, employers, development organizations** that can sponsor deployments for entire communities

## Problem it solves

- Caribbean households face recurring hurricanes, floods, landslides, and droughts. In Saint Lucia nearly half the population lives within 5 km of the coastline.
- Emergency information is fragmented across sites, social media, messages, and paper checklists.
- Families struggle to turn a general alert into a practical "what do I do now?" plan.
- During a crisis people need the next safe action — not a 30-page PDF.
- Disaster apps that require internet fail when it matters most.
- Small businesses lack affordable continuity and recovery tools.

IslandReady AI sits between trusted authorities (NEMO, CDEMA) and everyday households: it explains and personalizes official guidance, it does not replace it.

## Main features

1. **Readiness Score (0–100%)**
   Evaluates food, water, medical, communication, documents, power, home prep, evacuation plan, family contacts, and recovery prep. Example: "You're 78% ready. Your biggest gap is emergency communication."

2. **AI Emergency Assistant**
   Short, prioritized answers to "What should I do right now?", "How do I prepare for flooding?", "What goes in my emergency bag?" Built for RAG (Retrieval-Augmented Generation) over approved NEMO/CDEMA guides + safety guardrails.

3. **Family Emergency Plan**
   Emergency contacts, meeting locations (e.g. St. Jude's Church, Castries), family roles, communication and evacuation plan.

4. **Smart Supply Planner**
   Input household size + days + location → localized shopping list in EC$. Example: Water EC$72, food EC$150, first aid EC$65, flashlight/batteries EC$40, radio EC$60.

5. **Offline Emergency Pack**
   Family plan, contacts, checklist, and key instructions stored locally on the phone. Cloud provides intelligence when available; phone retains essentials.

6. **Recovery Hub**
   Photograph damage, add notes, organize evidence, track recovery tasks, find official assistance info. Future path to insurance/claims integration.

7. **Business Continuity Mode (planned)**
   Business readiness score, employee plans, drills for shops, hotels, schools, churches.

## How AI works (target architecture)

```
User + Household Profile + Location
  → Risk / Readiness Engine (hazard + vulnerability + readiness)
  → Trusted-Source Retrieval (RAG: NEMO / CDEMA / approved guides)
  → AI Engine (LLM + personalization prompts)
  → Safety Layer (rules, source checks, escalation)
  → One prioritized Next Action
```

Key principle: AI explains and personalizes; deterministic rules and official sources control safety-critical decisions.

## Repository contents

```
IslandReady AI/
├── README.md
├── .gitignore
└── doc/
    ├── IslandReady AI document.docx      # Concept + business plan
    ├── IslandReady_AI_Pitch_Deck-3.pptx  # 12-slide pitch deck
    └── IslandReady_AI_Prototype-5.html   # Clickable prototype (v0.1)
```

## Getting started

No build step. Open the prototype in a browser:

1. Go to `doc/IslandReady_AI_Prototype-5.html`
2. Double-click to open, or serve locally:
   ```powershell
   # Windows (PowerShell) — from repo root:
   Start-Process "doc\IslandReady_AI_Prototype-5.html"
   ```
3. Try: Home → Get Ready → AI Assistant → Family Plan → Supplies.

For GitHub Pages preview: upload and enable Pages on `main` branch, or move/copy the HTML to `index.html` at root.

## 90-day MVP roadmap

- Weeks 1–2: research + source governance
- Weeks 3–4: onboarding + readiness engine
- Weeks 5–6: RAG AI assistant
- Weeks 7–8: family plan + supply planner + offline pack
- Weeks 9–10: recovery + business mode
- Weeks 11–12: pilot with 50–100 households, measure readiness improvement

North-star metric: **households with a completed + tested emergency plan.**

## Business model (summary)

- Free: basic readiness + family plan
- Family Plus $4.99/mo: AI planning, scenarios, offline pack
- Family Pro $9.99/mo: multi-household, secure sharing, recovery tools
- Business $19–$49+/mo: continuity plans, drills
- Institutional (B2G/NGO): annual licensing + sponsored community deployments

## Safety disclaimer

This prototype gives general preparedness information only. Always follow official alerts and instructions from NEMO Saint Lucia, CDEMA, and local emergency authorities. Do not rely on this app instead of official guidance in a real emergency.

## Contributing

Early stage. Pilot partners, technical mentors, and resilience organizations welcome — see pitch deck slide "The Ask". Vision: every Caribbean household can answer WHO do I contact? WHERE do we go? WHAT do we do next?

