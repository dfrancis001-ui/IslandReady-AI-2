import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { myHouseholds } from "@/lib/households";
import ChecklistClient from "@/components/ChecklistClient";
import SiteHeader from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");
  const households = await myHouseholds(userId);
  if (households.length === 0) redirect("/signup");
  const household = households[0];

  const items = (
    await query('SELECT "key", title, detail FROM checklist_items ORDER BY "key"')
  ).rows as { key: string; title: string; detail: string }[];
  const doneRows = (await query(
    "SELECT item_key FROM household_checklist_state WHERE household_id = $1 AND done = TRUE",
    [household.id]
  )) as unknown as { rows: { item_key: string }[] };

  return (
    <>
      <SiteHeader active="/checklist" />
      <main className="ir-main" id="main">
        <section className="ir-card" aria-labelledby="checklist-title">
          <h2 id="checklist-title">✅ Preparedness Checklist</h2>
          <ChecklistClient
            householdId={household.id}
            items={items}
            initialDone={doneRows.rows.map((r) => r.item_key)}
          />
          <p><Link href="/dashboard">← Back to dashboard</Link></p>
        </section>
      </main>
    </>
  );
}
