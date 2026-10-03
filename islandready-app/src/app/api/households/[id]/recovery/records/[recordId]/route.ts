import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { deleteRecord, getRecord, updateRecord } from "@/lib/recovery";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; recordId: string }> };

async function userId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET(_req: Request, { params }: Ctx) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id, recordId } = await params;
  const record = await getRecord(uid, id, recordId);
  if (!record) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ record });
}

export async function PUT(req: Request, { params }: Ctx) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id, recordId } = await params;
  let body: { title?: unknown; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const result = await updateRecord(uid, id, recordId, String(body.title ?? ""), String(body.note ?? ""));
  if (result === "not-found") return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (typeof result === "object") return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id, recordId } = await params;
  const ok = await deleteRecord(uid, id, recordId);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
