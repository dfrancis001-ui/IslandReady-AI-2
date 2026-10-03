import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { requireOrgMembership } from "@/lib/orgs";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orgId: string }> };

async function userId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET(_req: Request, { params }: Ctx) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const orgId = (await params).orgId;
  if (!(await requireOrgMembership(uid, orgId))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const { rows } = await query(
    `SELECT c.key AS item, c.label, c.detail, COALESCE(s.done, FALSE) AS done
     FROM org_checks c LEFT JOIN org_checklist_state s
       ON s.item_key = c.key AND s.organization_id = $1
     ORDER BY c.key`,
    [orgId]
  );
  return NextResponse.json({ checks: rows });
}

export async function POST(req: Request, { params }: Ctx) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const orgId = (await params).orgId;
  if (!(await requireOrgMembership(uid, orgId))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  let body: { item?: unknown; done?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.item !== "string" || typeof body.done !== "boolean") {
    return NextResponse.json({ error: "Requires {item: string, done: boolean}." }, { status: 400 });
  }
  const known = await query("SELECT 1 FROM org_checks WHERE key = $1", [body.item]);
  if ((known.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: "Unknown item." }, { status: 400 });
  }
  await query(
    `INSERT INTO org_checklist_state (organization_id, item_key, done, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (organization_id, item_key)
     DO UPDATE SET done = EXCLUDED.done, updated_at = now()`,
    [orgId, body.item, body.done]
  );
  return NextResponse.json({ ok: true });
}
