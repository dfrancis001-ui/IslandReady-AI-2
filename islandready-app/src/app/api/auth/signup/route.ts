// IslandReady AI — open local signup (Phase 1, development only).
// Security: input validated; emails lowercased; bcrypt cost 12; each signup
// creates the user + their first household + owner membership in one transaction.
// Non-enumerating: an existing email gets the same {ok:true} shape (no session,
// no userId) as a new account — the response never confirms an email exists.
// Passwords and hashes are never logged or returned.
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getPool, query } from "@/lib/db";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{1,63}$/;

function householdId(): string {
  return "hh-" + randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown; community?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const community = String(body.community ?? "Castries").trim().slice(0, 100) || "Castries";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json(
      { error: "Password must be 8-128 characters." },
      { status: 400 }
    );
  }

  const existing = await query("SELECT 1 FROM users WHERE email = $1", [email]);
  if ((existing.rowCount ?? 0) > 0) {
    return NextResponse.json({ ok: true }); // same shape: no existence leak
  }

  const password_hash = await bcrypt.hash(password, 12);
  const userId = randomUUID();
  const hid = householdId();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)",
      [userId, email, password_hash]
    );
    await client.query(
      "INSERT INTO households (id, community) VALUES ($1, $2)",
      [hid, community]
    );
    await client.query(
      "INSERT INTO household_memberships (user_id, household_id, role) VALUES ($1, $2, 'owner')",
      [userId, hid]
    );
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  } finally {
    client.release();
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
