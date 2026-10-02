import SiteHeader from "@/components/SiteHeader";
import PhaseShell from "@/components/PhaseShell";

export default function FamilyPage() {
  return (
    <>
      <SiteHeader active="/family" />
      <main className="ir-main" id="main">
        <PhaseShell title="👨‍👩‍👧 Family Emergency Plan" phase="Phase 5">
          <p>
            Planned: emergency contacts, meeting point + backup, family roles,
            comms plan, and evacuation info — stored per household in PostgreSQL.
          </p>
          <p>No family-plan data is collected or stored in this phase.</p>
        </PhaseShell>
      </main>
    </>
  );
}
