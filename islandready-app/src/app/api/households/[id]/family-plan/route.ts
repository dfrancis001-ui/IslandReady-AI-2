import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getFamilyPlan, saveFamilyPlan, validatePlan } from "@/lib/family";

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
  const plan = await getFamilyPlan(uid, (await params).id);
  if (!plan) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ plan });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = await userId();
  if (!uid) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { error, plan } = validatePlan(body);
  if (error || !plan) return NextResponse.json({ error: error ?? "Invalid request." }, { status: 400 });
  try {
    const ok = await saveFamilyPlan(uid, (await params).id, plan);
    if (!ok) return NextResponse.json({ error: "Not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Unable to save family plan." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
