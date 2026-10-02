// IslandReady AI — Smart Supply Planner engine v1 (Phase 6).
// Deterministic pure function of (catalog rows, people, days). All money in
// integer cents. Quantity rules (approved):
//   water/flashlight... see db/migrations/005_supplies.sql header.
// No prices live here; catalog rows come from PostgreSQL supply_catalog.
export interface CatalogRow {
  key: string;
  label: string;
  unit: string;
  pricing_kind: "per_person_day" | "per_household" | "per_2_people" | "per_4_people";
  unit_price_cents: number;
  version: number;
}
export interface SupplyLine {
  key: string;
  label: string;
  qty: number;
  unit: string;
  unitPriceCents: number;
  lineTotalCents: number;
}

export const PEOPLE_MIN = 1;
export const PEOPLE_MAX = 30;
export const DAYS_MIN = 1;
export const DAYS_MAX = 30;

export function validateInputs(
  people: unknown,
  days: unknown
): { error?: string; clean?: { people: number; days: number } } {
  const p = typeof people === "number" ? people : NaN;
  const d = typeof days === "number" ? days : NaN;
  if (!Number.isInteger(p) || p < PEOPLE_MIN || p > PEOPLE_MAX) {
    return { error: `People must be a whole number from ${PEOPLE_MIN} to ${PEOPLE_MAX}.` };
  }
  if (!Number.isInteger(d) || d < DAYS_MIN || d > DAYS_MAX) {
    return { error: `Days must be a whole number from ${DAYS_MIN} to ${DAYS_MAX}.` };
  }
  return { clean: { people: p, days: d } };
}

export function qtyFor(kind: CatalogRow["pricing_kind"], people: number, days: number): number {
  switch (kind) {
    case "per_person_day":
      return people * days;
    case "per_household":
      return 1;
    case "per_2_people":
      return Math.ceil(people / 2);
    case "per_4_people":
      return Math.ceil(people / 4);
  }
}

export function calcSupplies(
  catalog: CatalogRow[],
  people: number,
  days: number
): { lines: SupplyLine[]; totalCents: number; version: number } {
  const lines = catalog.map((c) => {
    const qty = qtyFor(c.pricing_kind, people, days);
    return {
      key: c.key,
      label: c.label,
      qty,
      unit: c.unit,
      unitPriceCents: c.unit_price_cents,
      lineTotalCents: qty * c.unit_price_cents,
    };
  });
  return {
    lines,
    totalCents: lines.reduce((t, l) => t + l.lineTotalCents, 0),
    version: Math.max(...catalog.map((c) => c.version)),
  };
}

export function formatEC(cents: number): string {
  return `EC$${(cents / 100).toFixed(2)}`;
}
