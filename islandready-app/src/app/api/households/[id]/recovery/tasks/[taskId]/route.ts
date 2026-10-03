import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { deleteTask, updateTask } from "@/lib/recovery";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; taskId: string }> };

async function userId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function PUT(req: Request, { params }: Ctx) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id, taskId } = await params;
  const taskNum = Number(taskId);
  if (!Number.isInteger(taskNum)) return NextResponse.json({ error: "Invalid task." }, { status: 400 });
  let body: { label?: unknown; done?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const result = await updateTask(uid, id, taskNum, { label: body.label, done: body.done });
  if (result === "not-found") return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (typeof result === "object") return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id, taskId } = await params;
  const taskNum = Number(taskId);
  if (!Number.isInteger(taskNum)) return NextResponse.json({ error: "Invalid task." }, { status: 400 });
  const ok = await deleteTask(uid, id, taskNum);
  if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
