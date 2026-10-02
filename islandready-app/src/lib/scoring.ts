// IslandReady AI — scoring mirror v1 (Phase 4b).
// Mirrors engine/readiness_v1.py exactly. Weights are NEVER hard-coded here:
// they arrive as database rows (readiness_categories / checklist_items).
// Rounding matches Python: overall scores are always whole (all v1 weights are
// even, so weight/2 splits never produce .5); sub-scores round to 1 decimal.
export interface CategoryRow {
  key: string;
  label: string;
  weight: number;
}
export interface ItemRow {
  key: string;
  category: string;
  title: string;
  tags: string[];
}
export interface NbaAction {
  title: string;
  category: string;
  reason: string;
}

const NEED_LABELS: Record<string, string> = {
  baby: "baby",
  elderly: "elderly member",
  mobility: "mobility needs",
  pets: "pets",
};

export function subScores(
  cats: CategoryRow[],
  items: ItemRow[],
  done: Set<string>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of cats) {
    const keys = items.filter((i) => i.category === c.key).map((i) => i.key);
    const n = keys.filter((k) => done.has(k)).length;
    out[c.key] = Math.round((100 * n) / keys.length * 10) / 10;
  }
  return out;
}

export function score(
  cats: CategoryRow[],
  items: ItemRow[],
  done: Set<string>
): number {
  let total = 0;
  for (const c of cats) {
    const keys = items.filter((i) => i.category === c.key).map((i) => i.key);
    const n = keys.filter((k) => done.has(k)).length;
    total += (c.weight * n) / keys.length;
  }
  return Math.max(0, Math.min(100, Math.round(total)));
}

export function missingPoints(
  cats: CategoryRow[],
  items: ItemRow[],
  done: Set<string>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of cats) {
    const keys = items.filter((i) => i.category === c.key).map((i) => i.key);
    const missing = keys.filter((k) => !done.has(k)).length;
    out[c.key] = Math.round(((c.weight * missing) / keys.length) * 10) / 10;
  }
  return out;
}

// Canonical category order — mirrors engine/readiness_v1.py CATEGORIES exactly.
// biggestGap reproduces Python min() first-minimal semantics on this order,
// so same-weight ties (e.g. comms/medical) resolve identically in both stacks.
const CANONICAL_ORDER = [
  "food",
  "water",
  "medical",
  "comms",
  "documents",
  "power",
  "home_prep",
  "evacuation",
  "contacts",
  "recovery",
];

export function biggestGap(
  cats: CategoryRow[],
  items: ItemRow[],
  done: Set<string>
): string {
  const subs = subScores(cats, items, done);
  const byKey = new Map(cats.map((c) => [c.key, c]));
  let best = CANONICAL_ORDER[0];
  for (const key of CANONICAL_ORDER) {
    const w = byKey.get(key)!.weight;
    const bestW = byKey.get(best)!.weight;
    if (subs[key] < subs[best] || (subs[key] === subs[best] && w > bestW)) {
      best = key;
    }
  }
  return best;
}

export function nextBestActions(
  cats: CategoryRow[],
  items: ItemRow[],
  done: Set<string>,
  needs: Set<string>,
  n = 3
): NbaAction[] {
  const gaps = missingPoints(cats, items, done);
  const catLabel = new Map(cats.map((c) => [c.key, c.label]));
  const cand = items
    .filter((i) => !done.has(i.key))
    .map((i) => {
      const match = i.tags.filter((t) => needs.has(t));
      return { item: i, gap: gaps[i.category], boost: match.length > 0 ? 1 : 0, match };
    })
    .sort((a, b) => b.gap - a.gap || b.boost - a.boost || (a.item.title < b.item.title ? -1 : 1));
  return cand.slice(0, n).map(({ item, gap, match }) => ({
    title: item.title,
    category: item.category,
    reason:
      match.length > 0
        ? `Priority for ${match.map((m) => NEED_LABELS[m]).join(", ")} in your household; closes ${gap.toFixed(1)} missing points in ${catLabel.get(item.category)}.`
        : `Closes ${gap.toFixed(1)} of your missing points in ${catLabel.get(item.category)}.`,
  }));
}
