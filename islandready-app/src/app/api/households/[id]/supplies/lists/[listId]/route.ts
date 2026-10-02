import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { deleteList, getList, updateList } from "@/lib/supply-lists";

export const dynamic = "force-dynamic";

async function userId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

type Ctx = { params: Promise<{ id: string; listId: string }> };

// Non-members get 404 (not 403) so list existence is not leaked.
export async function GET(_req: Request, { params }: Ctx) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id, listId } = await params;
  const list = await getList(uid, id, listId);
  if (!list) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ list });
}

export async function PUT(req: Request, { params }: Ctx) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id, listId } = await params;
  let body: { name?: unknown; people?: unknown; days?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const result = await updateList(uid, id, listId, body.name, body.people, body.days);
    if (result === null || result === "not-found") {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (typeof result === "object") {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to update supply list." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id, listId } = await params;
  const ok = await deleteList(uid, id, listId);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
