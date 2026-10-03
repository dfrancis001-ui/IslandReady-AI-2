import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import MetricsClient from "@/components/MetricsClient";
import SiteHeader from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

// NOTE: figures load client-side from the platform-admin API (401/403 otherwise).
// This page itself carries no metrics; anonymous users go to login via middleware-style redirect.
export default async function MetricsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return (
    <>
      <SiteHeader active="/org" />
      <main className="ir-main" id="main">
        <section className="ir-card" aria-labelledby="m-title">
          <h2 id="m-title">📊 Institutional metrics (platform admins only)</h2>
          <p className="ir-sub">
            Aggregates only. Household-derived averages are suppressed below 5 contributing
            households. No household rows, IDs, notes, photos, plans, or PII are ever shown here.
          </p>
          <div id="metrics-body"><MetricsClient /></div>
          <p><Link href="/org">← Back to organizations</Link></p>
        </section>
      </main>
    </>
  );
}
