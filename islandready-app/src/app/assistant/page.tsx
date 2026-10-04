import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAiEnabled } from "@/lib/features";
import { myHouseholds } from "@/lib/households";
import AssistantChat from "@/components/AssistantChat";
import SiteHeader from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");
  const households = await myHouseholds(userId);
  if (households.length === 0) redirect("/signup");

  return (
    <>
      <SiteHeader active="/assistant" />
      <main className="ir-main" id="main">
        <section className="ir-card" aria-labelledby="ai-title">
          <h2 id="ai-title">🤖 AI Emergency Assistant</h2>
          <p className="ir-sub">
            Calm, source-grounded answers for {households[0].community}. Every answer cites its
            approved sources — currently IslandReady demonstration content while official
            source permission is pending.
          </p>
          <AssistantChat householdId={households[0].id} enabled={isAiEnabled()} />
          <p><Link href="/dashboard">← Back to dashboard</Link></p>
        </section>
      </main>
    </>
  );
}
