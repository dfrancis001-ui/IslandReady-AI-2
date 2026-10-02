import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { myHouseholds } from "@/lib/households";
import { listSummaries } from "@/lib/supply-lists";
import SupplyPlanner, { type SavedSummary } from "@/components/SupplyPlanner";
import SiteHeader from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function SuppliesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");
  const households = await myHouseholds(userId);
  if (households.length === 0) redirect("/signup");
  const household = households[0];

  const members = (await query(
    "SELECT COALESCE(SUM(n), 0)::int AS total FROM (SELECT COUNT(*) AS n FROM household_members WHERE household_id = $1) t",
    [household.id]
  )) as unknown as { rows: { total: number }[] };
  const memberCount = members.rows[0]?.total ?? 0;
  const lists = (await listSummaries(userId, household.id)) ?? [];

  return (
    <>
      <SiteHeader active="/supplies" />
      <main className="ir-main" id="main">
        <h2 style={{ margin: "0.5rem 0 0.2rem" }}>🧺 Smart Supply Planner (EC$)</h2>
        <p className="ir-sub">
          {household.community} · Baseline v1 planning rates (PRD/prototype — not surveyed retail
          prices). Saved lists snapshot their prices.
        </p>
        <SupplyPlanner
          householdId={household.id}
          defaultPeople={memberCount > 0 ? Math.min(memberCount, 30) : 4}
          initialLists={(lists as unknown as SavedSummary[]) ?? []}
        />
        <p><Link href="/dashboard">← Back to dashboard</Link></p>
      </main>
    </>
  );
}
