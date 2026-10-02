// IslandReady AI — membership-scoped Family Emergency Plan helpers (Phase 5).
// EVERY operation verifies the authenticated user's household membership first.
// Writes replace the whole plan transactionally (plan row + contacts + roles).
import { getPool, query } from "./db";
import { requireMembership } from "./households";

export interface FamilyContact {
  label: string;
  phone: string;
  note: string;
}
export interface FamilyRole {
  member: string;
  responsibility: string;
}
export interface FamilyPlanInput {
  meetingPoint: string;
  backupMeetingPoint: string;
  evacuationInfo: string;
  commsPlan: string;
  nextSteps: string;
  contacts: FamilyContact[];
  roles: FamilyRole[];
}

const MAX_CONTACTS = 10;
const MAX_ROLES = 12;

function clean(s: unknown, max: number): string {
  return String(s ?? "").trim().slice(0, max);
}

function validPhone(phone: string): boolean {
  return /^[+\d][\d\s\-().]{5,28}$/.test(phone);
}

/** Returns null when the body is invalid; otherwise the cleaned plan. */
export function validatePlan(body: unknown): { error?: string; plan?: FamilyPlanInput } {
  if (typeof body !== "object" || body === null) return { error: "Invalid request." };
  const b = body as Record<string, unknown>;
  const meetingPoint = clean(b.meetingPoint, 200);
  if (!meetingPoint) return { error: "Primary meeting point is required." };
  const contactsRaw = Array.isArray(b.contacts) ? b.contacts : [];
  const rolesRaw = Array.isArray(b.roles) ? b.roles : [];
  if (contactsRaw.length > MAX_CONTACTS) return { error: "Too many contacts (max 10)." };
  if (rolesRaw.length > MAX_ROLES) return { error: "Too many roles (max 12)." };
  const contacts: FamilyContact[] = [];
  for (const c of contactsRaw) {
    const r = c as Record<string, unknown>;
    const label = clean(r.label, 100);
    const phone = clean(r.phone, 30);
    if (!label || !phone) return { error: "Each contact needs a label and phone." };
    if (!validPhone(phone)) return { error: `Invalid phone for “${label}”.` };
    contacts.push({ label, phone, note: clean(r.note, 200) });
  }
  const roles: FamilyRole[] = [];
  for (const r of rolesRaw) {
    const rec = r as Record<string, unknown>;
    const member = clean(rec.member, 100);
    const responsibility = clean(rec.responsibility, 200);
    if (!member || !responsibility) {
      return { error: "Each role needs a member and a responsibility." };
    }
    roles.push({ member, responsibility });
  }
  return {
    plan: {
      meetingPoint,
      backupMeetingPoint: clean(b.backupMeetingPoint, 200),
      evacuationInfo: clean(b.evacuationInfo, 500),
      commsPlan: clean(b.commsPlan, 500),
      nextSteps: clean(b.nextSteps, 500),
      contacts,
      roles,
    },
  };
}

export async function getFamilyPlan(userId: string, householdId: string) {
  if (!(await requireMembership(userId, householdId))) return null;
  const plan = (
    await query(
      `SELECT meeting_point AS "meetingPoint",
              backup_meeting_point AS "backupMeetingPoint",
              evacuation_info AS "evacuationInfo",
              comms_plan AS "commsPlan",
              next_steps AS "nextSteps"
       FROM family_plans WHERE household_id = $1`,
      [householdId]
    )
  ).rows[0] as
    | {
        meetingPoint: string;
        backupMeetingPoint: string;
        evacuationInfo: string;
        commsPlan: string;
        nextSteps: string;
      }
    | undefined;
  if (!plan) return null;
  const contacts = (
    await query(
      `SELECT label, phone, note FROM family_contacts
       WHERE household_id = $1 ORDER BY position, id`,
      [householdId]
    )
  ).rows as FamilyContact[];
  const roles = (
    await query(
      `SELECT member_label AS member, responsibility FROM family_roles
       WHERE household_id = $1 ORDER BY position, id`,
      [householdId]
    )
  ).rows as FamilyRole[];
  return { ...plan, contacts, roles };
}

export async function saveFamilyPlan(
  userId: string,
  householdId: string,
  plan: FamilyPlanInput
): Promise<boolean> {
  if (!(await requireMembership(userId, householdId))) return false;
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO family_plans
         (household_id, meeting_point, backup_meeting_point, evacuation_info, comms_plan, next_steps, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (household_id) DO UPDATE SET
         meeting_point = EXCLUDED.meeting_point,
         backup_meeting_point = EXCLUDED.backup_meeting_point,
         evacuation_info = EXCLUDED.evacuation_info,
         comms_plan = EXCLUDED.comms_plan,
         next_steps = EXCLUDED.next_steps,
         updated_at = now()`,
      [householdId, plan.meetingPoint, plan.backupMeetingPoint, plan.evacuationInfo, plan.commsPlan, plan.nextSteps]
    );
    await client.query("DELETE FROM family_contacts WHERE household_id = $1", [householdId]);
    await client.query("DELETE FROM family_roles WHERE household_id = $1", [householdId]);
    let pos = 0;
    for (const c of plan.contacts) {
      await client.query(
        "INSERT INTO family_contacts (household_id, label, phone, note, position) VALUES ($1, $2, $3, $4, $5)",
        [householdId, c.label, c.phone, c.note, pos++]
      );
    }
    pos = 0;
    for (const r of plan.roles) {
      await client.query(
        "INSERT INTO family_roles (household_id, member_label, responsibility, position) VALUES ($1, $2, $3, $4)",
        [householdId, r.member, r.responsibility, pos++]
      );
    }
    await client.query("COMMIT");
    return true;
  } catch {
    await client.query("ROLLBACK");
    throw new Error("Unable to save family plan.");
  } finally {
    client.release();
  }
}
