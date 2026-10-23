import Link from "next/link";

import DemoHeader from "@/components/DemoHeader";
import RecoveryHub from "@/components/RecoveryHub";
import { DEMO_RECOVERY_RECORDS, DEMO_RECOVERY_TASKS } from "@/lib/demo-data";

export const metadata = { title: "IslandReady AI — Demo Recovery Hub" };

export default function DemoRecoveryPage() {
  return (
    <>
      <DemoHeader active="/demo/recovery" />
      <main className="ir-main" id="main">
        <section className="ir-card" aria-labelledby="demo-recovery-title">
          <span className="ir-badge ir-badge-info">Interactive demo</span>
          <h2 id="demo-recovery-title" style={{ marginTop: "0.5rem" }}>
            🌤️ Recovery Hub
          </h2>
          <p className="ir-sub">
            Add sample damage notes and recovery tasks, tick tasks off, and test
            the layout. Uploads are disabled in the demo and records exist only
            in the page session.
          </p>
          <p className="ir-hint">
            Use fictional notes only. This demo never stores photos, never
            contacts an insurer, and never writes to production data.
          </p>
        </section>

        <RecoveryHub
          householdId="demo"
          initialRecords={DEMO_RECOVERY_RECORDS}
          initialTasks={DEMO_RECOVERY_TASKS}
          uploadsEnabled={false}
          demo
        />

        <section className="ir-card" style={{ marginTop: "1rem" }}>
          <h2>Continue the demo</h2>
          <p style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <Link className="ir-btn ir-btn-primary" href="/demo/dashboard">
              Back to demo dashboard
            </Link>
            <Link className="ir-btn ir-btn-secondary" href="/demo/supplies">
              Supply planner →
            </Link>
            <Link className="ir-btn ir-btn-secondary" href="/demo/assistant">
              Sample assistant →
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
