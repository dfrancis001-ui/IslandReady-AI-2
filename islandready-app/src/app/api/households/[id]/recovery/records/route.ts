import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createRecord, listRecords } from "@/lib/recovery";

export const dynamic = "force-dynamic";

async function userId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const records = await listRecords(uid, (await params).id);
  if (!records) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ records });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  let body: { title?: unknown; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const result = await createRecord(
    uid, (await params).id, String(body.title ?? ""), String(body.note ?? "")
  );
  if (result === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result, { status: 201 });
}
