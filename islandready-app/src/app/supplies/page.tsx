import SiteHeader from "@/components/SiteHeader";
import PhaseShell from "@/components/PhaseShell";

export default function SuppliesPage() {
  return (
    <>
      <SiteHeader active="/supplies" />
      <main className="ir-main" id="main">
        <PhaseShell title="🧺 Smart Supply Planner (EC$)" phase="Phase 6">
          <p>
            Planned: quantities from household size × days at Saint Lucia prices
            (baseline: 4 people / 3 days = EC$432), with saved shopping lists.
          </p>
          <p>No supply calculations are performed in this phase.</p>
        </PhaseShell>
      </main>
    </>
  );
}
