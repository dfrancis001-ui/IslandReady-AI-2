import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getChecklistState, setChecklistItem } from "@/lib/households";

export const dynamic = "force-dynamic";

async function userId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

// Non-members get 404 (not 403) so household existence is not leaked.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const state = await getChecklistState(uid, (await params).id);
  if (!state) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ state });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  let body: { item?: unknown; done?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.item !== "string" || typeof body.done !== "boolean") {
    return NextResponse.json({ error: "Requires {item: string, done: boolean}." }, { status: 400 });
  }
  const result = await setChecklistItem(uid, (await params).id, body.item, body.done);
  if (result === "not-member") return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (result === "unknown-item") return NextResponse.json({ error: "Unknown item." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
