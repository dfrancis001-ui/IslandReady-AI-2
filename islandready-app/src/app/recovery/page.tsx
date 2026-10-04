import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isUploadsEnabled } from "@/lib/features";
import { myHouseholds } from "@/lib/households";
import { listRecords, listTasks } from "@/lib/recovery";
import RecoveryHub, { type Rec, type Task } from "@/components/RecoveryHub";
import SiteHeader from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function RecoveryPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");
  const households = await myHouseholds(userId);
  if (households.length === 0) redirect("/signup");
  const household = households[0];
  const records = (await listRecords(userId, household.id)) ?? [];
  const tasks = (await listTasks(userId, household.id)) ?? [];

  return (
    <>
      <SiteHeader active="/recovery" />
      <main className="ir-main" id="main">
        <h2 style={{ margin: "0.5rem 0 0.2rem" }}>🌤️ Recovery Hub</h2>
        <p className="ir-sub">
          You&apos;re not alone. Help is available. · {household.community} ·
          Your records, photos, and tasks — private to your household.
        </p>
        <RecoveryHub
          householdId={household.id}
          initialRecords={(records as unknown as Rec[]) ?? []}
          initialTasks={(tasks as unknown as Task[]) ?? []}
          uploadsEnabled={isUploadsEnabled()}
        />
        <p><Link href="/dashboard">← Back to dashboard</Link></p>
      </main>
    </>
  );
}
