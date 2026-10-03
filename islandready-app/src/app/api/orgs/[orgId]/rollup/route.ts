import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { requireOrgMembership } from "@/lib/orgs";

export const dynamic = "force-dynamic";

// EXPERIMENTAL organizational readiness roll-up. It measures ONLY this
// organization's own continuity-checklist completion (done/total). It is NOT
// a validated organizational-readiness standard and does NOT incorporate
// household readiness scores (households are not linked to organizations).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const orgId = (await params).orgId;
  const org = await requireOrgMembership(userId, orgId);
  if (!org) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE COALESCE(s.done, FALSE))::int AS done
     FROM org_checks c LEFT JOIN org_checklist_state s
       ON s.item_key = c.key AND s.organization_id = $1`,
    [orgId]
  );
  const { total, done } = rows[0] as { total: number; done: number };
  return NextResponse.json({
    organization: { id: org.id, name: org.name, kind: org.kind },
    experimental: true,
    measures:
      "Continuity-checklist completion for this organization only. Experimental; not a validated standard.",
    done,
    total,
    percent: total === 0 ? 0 : Math.round((100 * done) / total),
  });
}
