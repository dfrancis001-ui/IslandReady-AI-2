import SiteHeader from "@/components/SiteHeader";
import PhaseShell from "@/components/PhaseShell";

export default function RecoveryPage() {
  return (
    <>
      <SiteHeader active="/recovery" />
      <main className="ir-main" id="main">
        <PhaseShell title="🌤️ Recovery Hub" phase="Phase 10">
          <p>
            Planned: damage notes and photos, recovery checklists and task
            tracking, and official assistance information.
          </p>
          <p>No recovery records are collected or stored in this phase.</p>
        </PhaseShell>
      </main>
    </>
  );
}
