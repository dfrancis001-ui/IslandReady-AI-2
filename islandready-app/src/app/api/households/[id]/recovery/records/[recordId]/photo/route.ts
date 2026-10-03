import { promises as fs } from "node:fs";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { addPhoto, getPhoto, MAX_PHOTO_BYTES } from "@/lib/recovery";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; recordId: string }> };

async function userId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

// Photo bytes are NEVER served from a public URL — only here, authenticated
// and household/record-scoped.
export async function GET(_req: Request, { params }: Ctx) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id, recordId } = await params;
  const photo = await getPhoto(uid, id, recordId);
  if (!photo) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const bytes = await fs.readFile(photo.path);
  return new NextResponse(new Uint8Array(bytes), {
    headers: { "Content-Type": photo.mime, "Cache-Control": "private, no-store" },
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id, recordId } = await params;
  let file: File | null = null;
  try {
    const form = await req.formData();
    const v = form.get("photo");
    if (v instanceof File) file = v;
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Empty upload rejected." }, { status: 400 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Photo exceeds 5 MB." }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const result = await addPhoto(uid, id, recordId, buf);
    if (result === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if ("status" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to save photo." }, { status: 500 });
  }
}
