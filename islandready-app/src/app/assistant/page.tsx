import SiteHeader from "@/components/SiteHeader";
import PhaseShell from "@/components/PhaseShell";

export default function AssistantPage() {
  return (
    <>
      <SiteHeader active="/assistant" />
      <main className="ir-main" id="main">
        <PhaseShell title="🤖 AI Emergency Assistant" phase="Phase 8">
          <p>
            Planned topics: “What should I do?”, “Prepare for hurricane”,
            “Find shelter help” — each answer grounded in approved NEMO/CDEMA
            sources with an official-instructions disclaimer.
          </p>
          <p>
            <strong>No sample answers are shown here on purpose:</strong> until
            Phase 8 wires the trusted-source pipeline, this assistant must not
            invent guidance.
          </p>
        </PhaseShell>
      </main>
    </>
  );
}
