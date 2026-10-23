import Link from "next/link";

import DemoHeader from "@/components/DemoHeader";
import SupplyPlanner from "@/components/SupplyPlanner";
import { DEMO_SUPPLY_CATALOG, DEMO_SUPPLY_LISTS } from "@/lib/demo-data";

export const metadata = { title: "IslandReady AI — Demo Supply Planner" };

export default function DemoSuppliesPage() {
  return (
    <>
      <DemoHeader active="/demo/supplies" />
      <main className="ir-main" id="main">
        <section className="ir-card" aria-labelledby="demo-supplies-title">
          <span className="ir-badge ir-badge-info">Interactive demo</span>
          <h2 id="demo-supplies-title" style={{ marginTop: "0.5rem" }}>
            🧺 Supply Planner — EC$
          </h2>
          <p className="ir-sub">
            Calculate a kit from a sample Saint Lucia price catalog and save it
            to the session. The real planner uses household inputs; this demo
            keeps everything in your browser.
          </p>
          <p className="ir-hint">
            Prices and totals are illustrative only. The demo does not place
            orders, contact suppliers, or store a shopping list.
          </p>
        </section>

        <SupplyPlanner
          householdId="demo"
          defaultPeople={4}
          initialLists={DEMO_SUPPLY_LISTS}
          demo
          demoCatalog={DEMO_SUPPLY_CATALOG}
        />

        <section className="ir-card" style={{ marginTop: "1rem" }}>
          <h2>Continue the demo</h2>
          <p style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <Link className="ir-btn ir-btn-primary" href="/demo/dashboard">
              Back to demo dashboard
            </Link>
            <Link className="ir-btn ir-btn-secondary" href="/demo/checklist">
              Checklist →
            </Link>
            <Link className="ir-btn ir-btn-secondary" href="/demo/family">
              Family plan →
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
