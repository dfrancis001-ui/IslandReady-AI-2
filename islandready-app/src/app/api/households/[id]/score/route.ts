import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { requireMembership } from "@/lib/households";
import {
  biggestGap,
  missingPoints,
  nextBestActions,
  score,
  subScores,
  type CategoryRow,
  type ItemRow,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";

// Live readiness readout. Weights come from PostgreSQL (readiness_categories /
// checklist_items) — the UI hard-codes no scoring numbers. Household needs for
// personalization come from the Phase 2 members data when present.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const householdId = (await params).id;
  const household = await requireMembership(userId, householdId);
  if (!household) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const cats = (await query('SELECT "key", label, weight FROM readiness_categories ORDER BY "key"'))
    .rows as CategoryRow[];
  const items = (
    await query('SELECT "key", category_key AS category, title, tags FROM checklist_items ORDER BY "key"')
  ).rows as ItemRow[];
  const doneRes = await query(
    "SELECT item_key FROM household_checklist_state WHERE household_id = $1 AND done = TRUE",
    [householdId]
  );
  const doneRows = doneRes.rows as { item_key: string }[];
  const done = new Set(doneRows.map((r) => r.item_key));

  const needs = new Set<string>();
  try {
    const flagsRes = await query(
      "SELECT baby, elderly, mobility, pets FROM household_need_flags WHERE household_id = $1",
      [householdId]
    );
    const flags = flagsRes.rows as {
      baby: boolean;
      elderly: boolean;
      mobility: boolean;
      pets: boolean;
    }[];
    if (flags[0]) {
      for (const k of ["baby", "elderly", "mobility", "pets"] as const) {
        if (flags[0][k]) needs.add(k);
      }
    }
  } catch {
    // household_need_flags is optional garnish; scoring never depends on it.
  }

  return NextResponse.json({
    household: { id: household.id, community: household.community },
    done: [...done].sort(),
    total: items.length,
    score: score(cats, items, done),
    subScores: subScores(cats, items, done),
    missingPoints: missingPoints(cats, items, done),
    biggestGap: biggestGap(cats, items, done),
    actions: nextBestActions(cats, items, done, needs),
  });
}
