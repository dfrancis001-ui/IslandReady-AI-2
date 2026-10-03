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
  const org = await requireOrgMembership(uid, (await params).orgId);
  if (!org) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ org });
}

// Owner-only rename: the permission distinction between owner and member.
export async function PUT(req: Request, { params }: Ctx) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const orgId = (await params).orgId;
  const org = await requireOrgMembership(uid, orgId);
  if (!org) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (org.role !== "owner") {
    return NextResponse.json({ error: "Owners only." }, { status: 403 });
  }
  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const name = String(body.name ?? "").trim().slice(0, 150);
  if (!name) return NextResponse.json({ error: "Organization name is required." }, { status: 400 });
  await query("UPDATE organizations SET name = $1 WHERE id = $2", [name, orgId]);
  return NextResponse.json({ ok: true });
}
