import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getFamilyPlan } from "@/lib/family";
import { myHouseholds } from "@/lib/households";
import FamilyPlanForm from "@/components/FamilyPlanForm";
import SiteHeader from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");
  const households = await myHouseholds(userId);
  if (households.length === 0) redirect("/signup");
  const household = households[0];
  const existing = await getFamilyPlan(userId, household.id);

  return (
    <>
      <SiteHeader active="/family" />
      <main className="ir-main" id="main">
        <h2 style={{ margin: "0.5rem 0 0.2rem" }}>👨‍👩‍👧 Family Emergency Plan</h2>
        <p className="ir-sub">
          WHO do we contact? WHERE do we go? WHAT next? · {household.community} ·
          Saved to your household record in PostgreSQL.
        </p>
        <FamilyPlanForm
          householdId={household.id}
          initial={
            existing
              ? {
                  meetingPoint: existing.meetingPoint,
                  backupMeetingPoint: existing.backupMeetingPoint,
                  evacuationInfo: existing.evacuationInfo,
                  commsPlan: existing.commsPlan,
                  nextSteps: existing.nextSteps,
                  contacts: existing.contacts,
                  roles: existing.roles,
                }
              : null
          }
        />
        <p><Link href="/dashboard">← Back to dashboard</Link></p>
      </main>
    </>
  );
}
