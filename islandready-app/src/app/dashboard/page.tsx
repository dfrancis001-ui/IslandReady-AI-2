import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { myHouseholds } from "@/lib/households";
import SignOutButton from "./signout-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");
  const households = await myHouseholds(userId);
  return (
    <main style={{ maxWidth: 640, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>IslandReady AI — Dashboard</h1>
      <p>Signed in as {(session?.user as { email?: string } | undefined)?.email}</p>
      <SignOutButton />
      <h2>Your households</h2>
      <ul>
        {households.map((h) => (
          <li key={h.id}>{h.community}, {h.country} — {h.role} ({h.id})</li>
        ))}
      </ul>
    </main>
  );
}
