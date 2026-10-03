import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { myOrgs, requirePlatformAdmin } from "@/lib/orgs";
import OrgManager from "@/components/OrgManager";
import SiteHeader from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function OrgPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");
  const orgs = await myOrgs(userId);
  const admin = await requirePlatformAdmin(userId);

  return (
    <>
      <SiteHeader active="/org" />
      <main className="ir-main" id="main">
        <h2 style={{ margin: "0.5rem 0 0.2rem" }}>🏢 Organizations</h2>
        <p className="ir-sub">
          Business continuity foundation (experimental stub). Household features are unchanged.
          {admin ? (<> You are a platform admin — <Link href="/org/metrics">institutional metrics →</Link></>) : null}
        </p>
        <OrgManager initial={orgs} />
        <p><Link href="/dashboard">← Back to dashboard</Link></p>
      </main>
    </>
  );
}
