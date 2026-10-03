import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import OfflinePackView from "@/components/OfflinePackView";
import SiteHeader from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

// Served from the service-worker cache when offline. Renders only the
// device-local pack of the signed-in user (online) or whatever pack key the
// browser holds; pack.userId gating happens inside the viewer store.
export default async function OfflinePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");
  return (
    <>
      <SiteHeader active="/dashboard" />
      <main className="ir-main" id="main">
        <OfflinePackView userId={userId} />
      </main>
    </>
  );
}
