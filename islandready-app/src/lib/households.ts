// IslandReady AI — membership-scoped household helpers (Phase 1).
// EVERY household-scoped operation verifies the authenticated user's membership
// before touching household data (including Phase 3 checklist state).
import { query } from "./db";

export interface Household {
  id: string;
  community: string;
  country: string;
  role: string;
}

export async function myHouseholds(userId: string): Promise<Household[]> {
  const { rows } = await query(
    `SELECT h.id, h.community, h.country, m.role
     FROM households h JOIN household_memberships m ON m.household_id = h.id
     WHERE m.user_id = $1 ORDER BY h.id`,
    [userId]
  );
  return rows;
}

export async function requireMembership(
  userId: string,
  householdId: string
): Promise<Household | null> {
  const { rows } = await query(
    `SELECT h.id, h.community, h.country, m.role
     FROM households h JOIN household_memberships m ON m.household_id = h.id
     WHERE m.user_id = $1 AND h.id = $2`,
    [userId, householdId]
  );
  return rows[0] ?? null;
}

export async function getChecklistState(
  userId: string,
  householdId: string
): Promise<{ item: string; done: boolean }[] | null> {
  if (!(await requireMembership(userId, householdId))) return null;
  const { rows } = await query(
    `SELECT item_key AS item, done FROM household_checklist_state
     WHERE household_id = $1 ORDER BY item_key`,
    [householdId]
  );
  return rows;
}

export async function setChecklistItem(
  userId: string,
  householdId: string,
  item: string,
  done: boolean
): Promise<"ok" | "not-member" | "unknown-item"> {
  if (!(await requireMembership(userId, householdId))) return "not-member";
  const known = await query(
    "SELECT 1 FROM checklist_items WHERE \"key\" = $1",
    [item]
  );
  if (known.rowCount === 0) return "unknown-item";
  await query(
    `INSERT INTO household_checklist_state (household_id, item_key, done, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (household_id, item_key)
     DO UPDATE SET done = EXCLUDED.done, updated_at = now()`,
    [householdId, item, done]
  );
  return "ok";
}
