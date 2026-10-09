import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import OfflinePackView from "@/components/OfflinePackView";
import SiteHeader from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

// Served from the service-worker cache when offline. Authed users get their
// device-local pack viewer; anonymous or session errors get a public static
// shell (200, cacheable) instead of a redirect/500 so SW install + installed
// launches never fail. Test allows 200 or 307; we return 200 for anon.
export default async function OfflinePage() {
  let userId: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    userId = (session?.user as { id?: string } | undefined)?.id;
  } catch {
    userId = undefined;
  }
  if (!userId) {
    return (
      <>
        <SiteHeader active="/dashboard" />
        <main className="ir-main" id="main">
          <div className="ir-shell">
            <h2 style={{ marginTop: 0 }}>Offline essentials</h2>
            <p className="ir-sub">
              You are offline or not signed in on this device. Sign in while online,
              open your dashboard, and use “Save offline pack” to store a
              device-local copy of your essentials.
            </p>
            <p><Link href="/login">Sign in</Link> · <Link href="/dashboard">Dashboard</Link></p>
          </div>
        </main>
      </>
    );
  }
  return (
    <>
      <SiteHeader active="/dashboard" />
      <main className="ir-main" id="main">
        <OfflinePackView userId={userId} />
      </main>
    </>
  );
}
