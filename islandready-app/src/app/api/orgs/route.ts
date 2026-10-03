import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { myOrgs } from "@/lib/orgs";

export const dynamic = "force-dynamic";

const KINDS = ["business", "school", "church", "hotel", "NGO", "government"];

function orgId(): string {
  return "org-" + randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ orgs: await myOrgs(userId) });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  let body: { name?: unknown; kind?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const name = String(body.name ?? "").trim().slice(0, 150);
  const kind = String(body.kind ?? "");
  if (!name) return NextResponse.json({ error: "Organization name is required." }, { status: 400 });
  if (!KINDS.includes(kind)) {
    return NextResponse.json({ error: "Kind must be one of: " + KINDS.join(", ") + "." }, { status: 400 });
  }
  const id = orgId();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO organizations (id, name, kind) VALUES ($1, $2, $3)", [id, name, kind]);
    await client.query(
      "INSERT INTO organization_memberships (user_id, organization_id, role) VALUES ($1, $2, 'owner')",
      [userId, id]
    );
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Unable to create organization." }, { status: 500 });
  } finally {
    client.release();
  }
  return NextResponse.json({ id }, { status: 201 });
}
