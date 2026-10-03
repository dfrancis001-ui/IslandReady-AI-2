// IslandReady AI — organization membership helpers (Phase 11).
// Mirrors the household authorization conventions: unauthenticated callers are
// rejected by routes (401); non-members get null (routes answer 404).
import { query } from "./db";

export interface Org {
  id: string;
  name: string;
  kind: string;
  role: string;
}

export async function myOrgs(userId: string): Promise<Org[]> {
  const { rows } = await query(
    `SELECT o.id, o.name, o.kind, m.role
     FROM organizations o JOIN organization_memberships m ON m.organization_id = o.id
     WHERE m.user_id = $1 ORDER BY o.id`,
    [userId]
  );
  return rows;
}

export async function requireOrgMembership(
  userId: string,
  orgId: string
): Promise<Org | null> {
  const { rows } = await query(
    `SELECT o.id, o.name, o.kind, m.role
     FROM organizations o JOIN organization_memberships m ON m.organization_id = o.id
     WHERE m.user_id = $1 AND o.id = $2`,
    [userId, orgId]
  );
  return rows[0] ?? null;
}

export async function requirePlatformAdmin(userId: string): Promise<boolean> {
  const { rows } = await query(
    "SELECT is_platform_admin FROM users WHERE id = $1",
    [userId]
  );
  return rows[0]?.is_platform_admin === true;
}

export async function auditAccess(actorId: string, action: string): Promise<void> {
  try {
    await query("INSERT INTO audit_log (actor_id, action) VALUES ($1, $2)", [actorId, action]);
  } catch {
    // Audit must never break the request path.
  }
}
