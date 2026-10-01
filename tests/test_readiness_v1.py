"""Phase 3 verification suite — readiness engine v1.

Covers IMPLEMENTATION_PLAN.md Phase 3 Verification:
- fixtures at 0% / ~50% / 78% / 100%, movement on check/uncheck (5/12 -> 12/12)
- comms-gap household gets communication-first Next Best Action
- explanation names the true biggest gap in each fixture
- personalization: baby/elderly tags surface for matching households
- invalid input rejected

Run: python -m unittest discover -s tests -v   (from the repo root)
"""
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "engine"))
import readiness_v1 as r

FIX = os.path.join(os.path.dirname(__file__), "fixtures.json")
with open(FIX, encoding="utf-8") as f:
    DATA = json.load(f)

ALL = [i["key"] for i in r.ITEMS]


def expand(spec):
    done = []
    skip = set()
    for token in spec:
        if token == "all":
            done = list(ALL)
            break
        if token == "all_except":
            skip_all = True
            continue
        done.append(token)
    if "all_except" in spec:
        skip = set(spec[spec.index("all_except") + 1:])
        done = [k for k in ALL if k not in skip]
    return done


HOUSEHOLD = DATA["household"]


class TestWeights(unittest.TestCase):
    def test_weights_sum_to_100(self):
        self.assertEqual(sum(c["weight"] for c in r.CATEGORIES), 100)

    def test_ten_categories(self):
        self.assertEqual(len(r.CATEGORIES), 10)

    def test_twelve_items_all_categories_covered(self):
        self.assertEqual(len(r.ITEMS), 12)
        covered = {i["category"] for i in r.ITEMS}
        self.assertEqual(covered, {c["key"] for c in r.CATEGORIES})


class TestFixtures(unittest.TestCase):
    def test_F0_empty_scores_0(self):
        self.assertEqual(r.score(expand(DATA["fixtures"]["F0_empty"]["done"])), 0)

    def test_F1_half_scores_52(self):
        self.assertEqual(r.score(expand(DATA["fixtures"]["F1_half"]["done"])), 52)

    def test_F2_proto78_scores_78(self):
        self.assertEqual(r.score(expand(DATA["fixtures"]["F2_proto78"]["done"])), 78)

    def test_F3_full_scores_100(self):
        self.assertEqual(r.score(expand(DATA["fixtures"]["F3_full"]["done"])), 100)

    def test_F4_five_then_full_rises(self):
        five = expand(DATA["fixtures"]["F4_five"]["done"])
        self.assertEqual(r.score(five), 44)
        self.assertEqual(r.score(ALL), 100)
        self.assertGreater(r.score(ALL), r.score(five))

    def test_uncheck_lowers_score(self):
        full = set(ALL)
        self.assertGreater(r.score(full), r.score(full - {"store_water"}))


class TestGaps(unittest.TestCase):
    def test_F6_water_gap_named(self):
        done = expand(DATA["fixtures"]["F6_water_gap"]["done"])
        self.assertEqual(r.score(done), 86)
        self.assertEqual(r.biggest_gap(done), "water")

    def test_F0_empty_gap_tiebreak_highest_weight(self):
        self.assertEqual(r.biggest_gap([]), "water")  # 14 pts, highest weight

    def test_F3_full_gap_is_zero_everywhere(self):
        self.assertEqual(sum(r.missing_points(ALL).values()), 0)


class TestNBA(unittest.TestCase):
    def test_F5_comms_gap_nba_first(self):
        done = expand(DATA["fixtures"]["F5_comms_gap"]["done"])
        self.assertEqual(r.score(done), 80)
        nba = r.next_best_actions(done, HOUSEHOLD)
        self.assertEqual(len(nba), 2)  # only 2 items incomplete in this fixture
        self.assertEqual(nba[0]["category"], "comms")

    def test_nba_personalizes_for_baby(self):
        nba = r.next_best_actions([], HOUSEHOLD)  # household has baby + elderly
        self.assertEqual(nba[0]["item"], "store_water")  # top category + baby tag
        self.assertIn("baby", nba[0]["reason"])

    def test_nba_empty_when_complete(self):
        self.assertEqual(r.next_best_actions(ALL, HOUSEHOLD), [])


class TestSubScores(unittest.TestCase):
    def test_partial_category(self):
        subs = r.sub_scores(["secure_windows"])  # 1 of 2 home_prep
        self.assertEqual(subs["home_prep"], 50.0)
        self.assertEqual(subs["water"], 0.0)

    def test_ranges(self):
        for v in r.sub_scores(ALL).values():
            self.assertGreaterEqual(v, 0)
            self.assertLessEqual(v, 100)


class TestInputValidation(unittest.TestCase):
    def test_unknown_item_rejected(self):
        with self.assertRaises(ValueError):
            r.score(["drop_table"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
