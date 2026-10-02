// IslandReady AI — supply list data helpers (Phase 6).
// Membership-scoped like family/checklist helpers. Saved lists snapshot
// catalog lines+prices; recalculation always uses the current catalog and
// bumps pricing_version, so history is never silently rewritten.
import { randomUUID } from "crypto";
import { getPool, query } from "./db";
import { requireMembership } from "./households";
import { calcSupplies, validateInputs, type CatalogRow } from "./supplies";

export async function getCatalog(): Promise<CatalogRow[]> {
  const { rows } = await query(
    `SELECT key, label, unit, pricing_kind, unit_price_cents, version
     FROM supply_catalog ORDER BY key`
  );
  return rows as CatalogRow[];
}

export async function calculate(
  userId: string,
  householdId: string,
  people: unknown,
  days: unknown
) {
  if (!(await requireMembership(userId, householdId))) return null;
  const v = validateInputs(people, days);
  if (v.error || !v.clean) return { error: v.error ?? "Invalid inputs." };
  const result = calcSupplies(await getCatalog(), v.clean.people, v.clean.days);
  return { ...result, people: v.clean.people, days: v.clean.days };
}

function listId(): string {
  return "sl-" + randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function saveList(
  userId: string,
  householdId: string,
  name: unknown,
  people: unknown,
  days: unknown
): Promise<{ id: string } | { error: string } | null> {
  if (!(await requireMembership(userId, householdId))) return null;
  const cleanName = String(name ?? "").trim().slice(0, 100);
  if (!cleanName) return { error: "List name is required." };
  const v = validateInputs(people, days);
  if (v.error || !v.clean) return { error: v.error ?? "Invalid inputs." };
  // Server recalculates from the current catalog; client totals are never trusted.
  const result = calcSupplies(await getCatalog(), v.clean.people, v.clean.days);
  const id = listId();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO supply_lists
         (id, household_id, name, people, days, pricing_version, total_cents, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
      [id, householdId, cleanName, v.clean.people, v.clean.days, result.version, result.totalCents]
    );
    let pos = 0;
    for (const l of result.lines) {
      await client.query(
        `INSERT INTO supply_list_lines
           (list_id, item_key, qty, unit_price_cents, line_total_cents, position)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, l.key, l.qty, l.unitPriceCents, l.lineTotalCents, pos++]
      );
    }
    await client.query("COMMIT");
    return { id };
  } catch {
    await client.query("ROLLBACK");
    throw new Error("Unable to save supply list.");
  } finally {
    client.release();
  }
}

export async function listSummaries(userId: string, householdId: string) {
  if (!(await requireMembership(userId, householdId))) return null;
  const { rows } = await query(
    `SELECT id, name, people, days, pricing_version AS "pricingVersion",
            total_cents AS "totalCents", updated_at AS "updatedAt"
     FROM supply_lists WHERE household_id = $1 ORDER BY updated_at DESC`,
    [householdId]
  );
  return rows;
}

export async function getList(userId: string, householdId: string, id: string) {
  if (!(await requireMembership(userId, householdId))) return null;
  const head = (
    await query(
      `SELECT id, name, people, days, pricing_version AS "pricingVersion",
              total_cents AS "totalCents"
       FROM supply_lists WHERE id = $1 AND household_id = $2`,
      [id, householdId]
    )
  ).rows[0];
  if (!head) return null;
  const { rows: lines } = await query(
    `SELECT l.item_key AS key, c.label, l.qty, c.unit,
            l.unit_price_cents AS "unitPriceCents",
            l.line_total_cents AS "lineTotalCents"
     FROM supply_list_lines l JOIN supply_catalog c ON c.key = l.item_key
     WHERE l.list_id = $1 ORDER BY l.position, l.id`,
    [id]
  );
  return { ...head, lines };
}

export async function updateList(
  userId: string,
  householdId: string,
  id: string,
  name: unknown,
  people: unknown,
  days: unknown
): Promise<"ok" | "not-found" | { error: string } | null> {
  if (!(await requireMembership(userId, householdId))) return null;
  const owns = await query(
    "SELECT 1 FROM supply_lists WHERE id = $1 AND household_id = $2",
    [id, householdId]
  );
  if ((owns.rowCount ?? 0) === 0) return "not-found";
  const cleanName = String(name ?? "").trim().slice(0, 100);
  if (!cleanName) return { error: "List name is required." };
  const v = validateInputs(people, days);
  if (v.error || !v.clean) return { error: v.error ?? "Invalid inputs." };
  // Recalculate from the CURRENT catalog; snapshot + version update explicitly.
  const result = calcSupplies(await getCatalog(), v.clean.people, v.clean.days);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE supply_lists SET name = $1, people = $2, days = $3,
        pricing_version = $4, total_cents = $5, updated_at = now()
       WHERE id = $6 AND household_id = $7`,
      [cleanName, v.clean.people, v.clean.days, result.version, result.totalCents, id, householdId]
    );
    await client.query("DELETE FROM supply_list_lines WHERE list_id = $1", [id]);
    let pos = 0;
    for (const l of result.lines) {
      await client.query(
        `INSERT INTO supply_list_lines
           (list_id, item_key, qty, unit_price_cents, line_total_cents, position)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, l.key, l.qty, l.unitPriceCents, l.lineTotalCents, pos++]
      );
    }
    await client.query("COMMIT");
    return "ok";
  } catch {
    await client.query("ROLLBACK");
    throw new Error("Unable to update supply list.");
  } finally {
    client.release();
  }
}

export async function deleteList(
  userId: string,
  householdId: string,
  id: string
): Promise<boolean> {
  if (!(await requireMembership(userId, householdId))) return false;
  const r = await query(
    "DELETE FROM supply_lists WHERE id = $1 AND household_id = $2",
    [id, householdId]
  );
  return (r.rowCount ?? 0) > 0;
}
