# Readiness Model v1 — documented weights (Phase 3 deliverable)

**Version:** v1. Any weight change requires a version bump and re-run of the fixture suite.

## Scoring rule

For each category: `sub_score = 100 × done_items / total_items` (rounded to 1 decimal).
Overall: `score = round(Σ category_weight × done_items / total_items)`, clamped 0–100.

A category's weight is split equally across its items. Example: `water` weighs 14 and
has 1 item, so `store_water` is worth 14 points. `home_prep` weighs 10 across 2 items,
so each is worth 5 points.

## Category weights (sum = 100)

| Category | Weight | Items | Points per item | Why this weight |
|---|---:|---:|---:|---|
| water | 14 | 1 | 14 | Survival-critical; 3-day storage is the top PRD gap driver |
| food | 12 | 1 | 12 | Survival-critical incl. baby food |
| medical | 12 | 1 | 12 | Prescriptions / baby / elderly meds |
| comms | 12 | 1 | 12 | Prototype's named biggest gap ("emergency communication") |
| home_prep | 10 | 2 | 5 | Shutters + drains prevent the most common damage |
| evacuation | 10 | 2 | 5 | Route + meeting point (WHO/WHERE) |
| documents | 8 | 1 | 8 | IDs/insurance needed for recovery |
| power | 8 | 1 | 8 | Outage likelihood elevated in-season |
| contacts | 8 | 1 | 8 | Out-of-island contact |
| recovery | 6 | 1 | 6 | Lower pre-event weight by design; rises in importance post-event (Recovery Hub) |

## Next Best Action rule (v1)

1. Rank **incomplete categories** by missing points (`weight × missing_fraction`), descending.
2. Within the top categories, apply household personalization boosts: an item tagged
   `baby`/`elderly`/`mobility`/`pets` moves first when the household profile reports
   that member/need. Ties break toward the higher-weight category.
3. Return the top 3 incomplete items, each with a one-line reason
   ("Closes N of your M missing points" or "Priority for baby/elderly in your household").
4. The score explanation always names the lowest sub-score category as the biggest gap.

## Verification fixtures (see `tests/fixtures.json`)

| Fixture | Done | Missing points | Expected score |
|---|---|---:|---:|
| F0_empty | none | 100 | 0 |
| F1_half | water, food, home_prep×2, power, documents (6/12) | 48 | 52 |
| F2_proto78 | all except power, contacts, recovery (9/12) | 22 | 78 |
| F3_full | all 12 | 0 | 100 |
| F4_five | water, food, home_prep×2, documents (5/12) | 56 | 44 → rises to 100 at 12/12 |
| F5_comms_gap | all except comms + contacts | 20 | 80, NBA #1 is a comms item |
| F6_water_gap | all except water | 14 | 86, biggest gap named = Water |
