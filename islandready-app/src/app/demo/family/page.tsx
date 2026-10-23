import Link from "next/link";

import DemoHeader from "@/components/DemoHeader";
import FamilyPlanForm from "@/components/FamilyPlanForm";
import { DEMO_PLAN } from "@/lib/demo-data";

export const metadata = { title: "IslandReady AI — Demo Family Plan" };

export default function DemoFamilyPage() {
  return (
    <>
      <DemoHeader active="/demo/family" />
      <main className="ir-main" id="main">
        <section className="ir-card" aria-labelledby="demo-family-title">
          <span className="ir-badge ir-badge-info">Interactive demo</span>
          <h2 id="demo-family-title" style={{ marginTop: "0.5rem" }}>
            👨‍👩‍👧 Family Emergency Plan
          </h2>
          <p className="ir-sub">
            The real family-plan form, pre-filled with clearly fictional contacts
            and roles. Edit any field and choose Save Family Plan to see how the
            form validates locally. Nothing is written to a database.
          </p>
          <p className="ir-hint">
            Names and phone numbers are examples. Use 758-555-01xx style numbers
            only; do not enter real private information into this demo.
          </p>
        </section>

        <FamilyPlanForm householdId="demo" initial={DEMO_PLAN} demo />

        <section className="ir-card" style={{ marginTop: "1rem" }}>
          <h2>Continue the demo</h2>
          <p style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <Link className="ir-btn ir-btn-primary" href="/demo/dashboard">
              Back to demo dashboard
            </Link>
            <Link className="ir-btn ir-btn-secondary" href="/demo/supplies">
              Supply planner →
            </Link>
            <Link className="ir-btn ir-btn-secondary" href="/demo/recovery">
              Recovery hub →
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
