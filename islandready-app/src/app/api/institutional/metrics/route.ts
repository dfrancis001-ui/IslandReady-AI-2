import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { auditAccess, requirePlatformAdmin } from "@/lib/orgs";
import { score, type CategoryRow, type ItemRow } from "@/lib/scoring";

export const dynamic = "force-dynamic";

const MIN_HOUSEHOLDS = 5;

// Institutional pilot metrics. Aggregates ONLY — no household rows, IDs, names,
// notes, photos, plans, or PII ever leave this endpoint. Any household-derived
// metric with fewer than MIN_HOUSEHOLDS contributors is suppressed (null).
// Default-deny: platform-admin sessions only.
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!(await requirePlatformAdmin(userId))) {
    return NextResponse.json({ error: "Platform administrators only." }, { status: 403 });
  }

  // Completed continuity plans: organizations with every check done (org-level only).
  const completed = (
    await query(
      `SELECT COUNT(*)::int AS n FROM organizations o
       WHERE NOT EXISTS (
         SELECT 1 FROM org_checks c
         LEFT JOIN org_checklist_state s
           ON s.item_key = c.key AND s.organization_id = o.id
         WHERE COALESCE(s.done, FALSE) = FALSE
       )`
    )
  ).rows[0].n as number;

  // Baseline average readiness across participating households (computed live
  // from checklist state with catalog weights; no score history exists yet, so
  // change-over-time is deferred and documented, not fabricated).
  const cats = (
    await query('SELECT "key", label, weight FROM readiness_categories ORDER BY "key"')
  ).rows as CategoryRow[];
  const items = (
    await query('SELECT "key", category_key AS category, title, tags FROM checklist_items ORDER BY "key"')
  ).rows as ItemRow[];
  const states = (
    await query(
      `SELECT household_id, array_agg(item_key) FILTER (WHERE done) AS done
       FROM household_checklist_state GROUP BY household_id`
    )
  ).rows as { household_id: string; done: string[] | null }[];
  const scores = states.map((r) => score(cats, items, new Set(r.done ?? [])));
  const n = scores.length;
  const average =
    n >= MIN_HOUSEHOLDS ? Math.round((scores.reduce((t, s) => t + s, 0) / n) * 10) / 10 : null;

  await auditAccess(userId, "institutional-metrics");

  return NextResponse.json({
    completedContinuityPlans: completed,
    averageReadiness: average,
    contributingHouseholds: n,
    suppressed: n < MIN_HOUSEHOLDS,
    note: average === null
      ? `Average readiness suppressed: fewer than ${MIN_HOUSEHOLDS} contributing households.`
      : "Baseline average across participating households (live checklist state). Score-change tracking requires history not yet collected.",
  });
}
