import Link from "next/link";

import ChecklistClient from "@/components/ChecklistClient";
import DemoHeader from "@/components/DemoHeader";
import { DEMO_CATEGORIES, DEMO_DONE, DEMO_ITEMS } from "@/lib/demo-data";

export const metadata = { title: "IslandReady AI — Demo Checklist" };

export default function DemoChecklistPage() {
  return (
    <>
      <DemoHeader active="/demo/checklist" />
      <main className="ir-main" id="main">
        <section className="ir-card" aria-labelledby="demo-checklist-title">
          <span className="ir-badge ir-badge-info">Interactive demo</span>
          <h2 id="demo-checklist-title" style={{ marginTop: "0.5rem" }}>
            ✅ Household Checklist
          </h2>
          <p className="ir-sub">
            This is the real checklist component running on isolated sample data.
            Tick items to watch the local score change. In the full app these
            changes are saved to your household; here they last only until you
            reload the page.
          </p>
          <p className="ir-hint">
            Sample household only. No account, no sign-in, no database write.
          </p>
        </section>

        <ChecklistClient
          householdId="demo"
          items={DEMO_ITEMS}
          initialDone={DEMO_DONE}
          demo
          demoCategories={DEMO_CATEGORIES}
        />

        <section className="ir-card" style={{ marginTop: "1rem" }}>
          <h2>Continue the demo</h2>
          <p style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <Link className="ir-btn ir-btn-primary" href="/demo/dashboard">
              Back to demo dashboard
            </Link>
            <Link className="ir-btn ir-btn-secondary" href="/demo/family">
              Family plan →
            </Link>
            <Link className="ir-btn ir-btn-secondary" href="/demo/supplies">
              Supply planner →
            </Link>
          </p>
          <p className="ir-hint">
            The checklist mirrors the seeded Hurricane &amp; Flood plan. Demo
            changes are local only and are not sent to the production app.
          </p>
        </section>
      </main>
    </>
  );
}
