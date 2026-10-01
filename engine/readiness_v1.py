"""IslandReady AI readiness engine — Phase 3.

Version: v1 (weights documented in docs/readiness_weights_v1.md).
Pure standard library: scoring, sub-scores, gap detection, Next Best Action.

Scoring rule: score = round(SUM(category_weight * done/total)) over the 10
readiness categories (weights sum to 100). A category's weight is split
equally across its items.
"""

VERSION = "v1"

CATEGORIES = [
    {"key": "food", "label": "Food", "weight": 12},
    {"key": "water", "label": "Water", "weight": 14},
    {"key": "medical", "label": "Medical supplies", "weight": 12},
    {"key": "comms", "label": "Communication", "weight": 12},
    {"key": "documents", "label": "Important documents", "weight": 8},
    {"key": "power", "label": "Power", "weight": 8},
    {"key": "home_prep", "label": "Home preparation", "weight": 10},
    {"key": "evacuation", "label": "Evacuation plan", "weight": 10},
    {"key": "contacts", "label": "Family contacts", "weight": 8},
    {"key": "recovery", "label": "Recovery preparation", "weight": 6},
]

ITEMS = [
    {"key": "secure_windows", "category": "home_prep", "title": "Secure windows & doors", "detail": "Shutters closed, test one window", "tags": ["general"]},
    {"key": "clear_drains", "category": "home_prep", "title": "Clear drains & gutters", "detail": "Prevent yard flooding", "tags": ["general"]},
    {"key": "store_water", "category": "water", "title": "Store drinking water (3 days)", "detail": "4 people, 12 gal + baby formula", "tags": ["baby"]},
    {"key": "store_food", "category": "food", "title": "Store 3-day food + baby food", "detail": "Canned food, baby food, manual can opener", "tags": ["baby"]},
    {"key": "first_aid_meds", "category": "medical", "title": "First-aid kit + meds ready", "detail": "Prescriptions, baby meds, Gran meds", "tags": ["baby", "elderly"]},
    {"key": "charge_devices", "category": "power", "title": "Charge devices & radio batteries", "detail": "Power banks + torch", "tags": ["general"]},
    {"key": "radio_contact", "category": "comms", "title": "Test radio + phone tree", "detail": "Wind-up radio, out-of-island contact test", "tags": ["elderly"]},
    {"key": "protect_docs", "category": "documents", "title": "Protect docs in zip bag", "detail": "IDs, insurance, clinic cards", "tags": ["general"]},
    {"key": "evac_route", "category": "evacuation", "title": "Confirm evacuation route", "detail": "Castries to St. Jude hall, 12 min", "tags": ["mobility"]},
    {"key": "meeting_point", "category": "evacuation", "title": "Confirm meeting point", "detail": "St. Jude Church hall; backup uphill", "tags": ["general"]},
    {"key": "island_contact", "category": "contacts", "title": "Set out-of-island contact", "detail": "Biggest common score gap", "tags": ["general"]},
    {"key": "photo_home", "category": "recovery", "title": "Photograph home + key docs", "detail": "For assistance / insurance organization", "tags": ["general"]},
]

ALL_ITEM_KEYS = [i["key"] for i in ITEMS]
ITEM_BY_KEY = {i["key"]: i for i in ITEMS}
CAT_BY_KEY = {c["key"]: c for c in CATEGORIES}

NEED_LABELS = {"baby": "baby", "elderly": "elderly member", "mobility": "mobility needs", "pets": "pets"}


def _check_known(done):
    unknown = set(done) - set(ALL_ITEM_KEYS)
    if unknown:
        raise ValueError("Unknown checklist items: %s" % sorted(unknown))


def sub_scores(done):
    """Per-category sub-scores (0-100). `done` is an iterable of item keys."""
    done = set(done)
    _check_known(done)
    out = {}
    for cat in CATEGORIES:
        keys = [i["key"] for i in ITEMS if i["category"] == cat["key"]]
        n = sum(1 for k in keys if k in done)
        out[cat["key"]] = round(100.0 * n / len(keys), 1)
    return out


def score(done):
    """Overall readiness score 0-100."""
    done = set(done)
    _check_known(done)
    total = 0.0
    for cat in CATEGORIES:
        keys = [i["key"] for i in ITEMS if i["category"] == cat["key"]]
        n = sum(1 for k in keys if k in done)
        total += cat["weight"] * n / len(keys)
    return max(0, min(100, round(total)))


def missing_points(done):
    """Missing points per category (weight * missing fraction)."""
    done = set(done)
    _check_known(done)
    out = {}
    for cat in CATEGORIES:
        keys = [i["key"] for i in ITEMS if i["category"] == cat["key"]]
        missing = sum(1 for k in keys if k not in done)
        out[cat["key"]] = round(cat["weight"] * missing / len(keys), 1)
    return out


def biggest_gap(done):
    """Category key with the lowest sub-score; ties break to highest weight."""
    subs = sub_scores(done)
    return min(CATEGORIES, key=lambda c: (subs[c["key"]], -c["weight"]))["key"]


def household_needs(household):
    """Personalization flags present in the household profile (Phase 2 shape)."""
    members = (household or {}).get("members", {}) or {}
    return {need for need in NEED_LABELS if members.get(need)}


def next_best_actions(done, household=None, n=3):
    """Top-n incomplete items, ranked by missing category points, then
    household personalization (baby/elderly/mobility/pets tags first)."""
    done = set(done)
    _check_known(done)
    needs = household_needs(household)
    gaps = missing_points(done)
    candidates = []
    for item in ITEMS:
        if item["key"] in done:
            continue
        boost = 1 if (set(item["tags"]) & needs) else 0
        match = sorted(set(item["tags"]) & needs)
        candidates.append((gaps[item["category"]], boost, item, match))
    candidates.sort(key=lambda c: (-c[0], -c[1], c[2]["title"]))
    actions = []
    for gap_pts, boost, item, match in candidates[:n]:
        cat = CAT_BY_KEY[item["category"]]
        if match:
            who = ", ".join(NEED_LABELS[m] for m in match)
            reason = "Priority for %s in your household; closes %.1f missing points in %s." % (
                who, gap_pts, cat["label"])
        else:
            reason = "Closes %.1f of your missing points in %s." % (gap_pts, cat["label"])
        actions.append({"item": item["key"], "title": item["title"],
                        "category": item["category"], "reason": reason})
    return actions
