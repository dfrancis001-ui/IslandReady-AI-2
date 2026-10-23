import Link from "next/link";

import AssistantChat from "@/components/AssistantChat";
import DemoHeader from "@/components/DemoHeader";

export const metadata = { title: "IslandReady AI — Demo Assistant" };

export default function DemoAssistantPage() {
  return (
    <>
      <DemoHeader active="/demo/assistant" />
      <main className="ir-main" id="main">
        <section className="ir-card" aria-labelledby="demo-assistant-title">
          <span className="ir-badge ir-badge-info">Fixed sample answers</span>
          <h2 id="demo-assistant-title" style={{ marginTop: "0.5rem" }}>
            🤖 IslandHelper — assessor demo
          </h2>
          <p className="ir-sub">
            This is the real assistant interface in sample mode. It returns fixed
            demonstration answers and never calls a live AI model. The production
            assistant is source-grounded and available only to signed-in
            households.
          </p>
          <p className="ir-hint">
            Do not use demo answers for emergencies. Follow NEMO Saint Lucia,
            CDEMA and local emergency services.
          </p>
        </section>

        <AssistantChat householdId="demo" demo />

        <section className="ir-card" style={{ marginTop: "1rem" }}>
          <h2>Continue the demo</h2>
          <p style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <Link className="ir-btn ir-btn-primary" href="/demo/dashboard">
              Back to demo dashboard
            </Link>
            <Link className="ir-btn ir-btn-secondary" href="/demo/checklist">
              Checklist →
            </Link>
            <Link className="ir-btn ir-btn-secondary" href="/demo">
              Demo overview →
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
