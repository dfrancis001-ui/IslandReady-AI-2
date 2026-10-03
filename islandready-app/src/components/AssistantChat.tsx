"use client";
import { useState } from "react";

interface AskResult {
  steps?: string[];
  sources?: { title: string; publisher: string; registryId: string; version: number }[];
  disclaimer?: string;
  refusal?: string;
  redirectTo?: string;
  error?: string;
}

const CHIPS = ["What should I do?", "Prepare for hurricane", "Find shelter help"];

export default function AssistantChat({ householdId }: { householdId: string }) {
  const [log, setLog] = useState<{ me: boolean; text: string }[]>([
    { me: false, text: "I'm IslandHelper. Ask about hurricanes, shelters, or what to do right now — every answer cites its approved sources." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [online] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    if (!online) {
      setLog((l) => [...l, { me: true, text: question },
        { me: false, text: "Assistant unavailable offline — open your essentials and follow official NEMO/CDEMA radio guidance." }]);
      return;
    }
    setBusy(true);
    setLog((l) => [...l, { me: true, text: question }]);
    setInput("");
    try {
      const r = await fetch(`/api/households/${householdId}/assistant/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const j: AskResult = await r.json();
      if (j.steps) {
        const cited = j.steps
          .map((s, i) => `${i + 1}. ${s}`)
          .join("\n");
        const srcs = (j.sources ?? [])
          .map((s) => `• ${s.title} (${s.publisher}, ${s.registryId} v${s.version})`)
          .join("\n");
        setLog((l) => [...l, { me: false, text: `${cited}\n\nSources:\n${srcs}\n\n${j.disclaimer ?? ""}` }]);
      } else if (j.refusal) {
        setLog((l) => [...l, { me: false, text: `${j.refusal}\n\nOfficial channels: ${j.redirectTo ?? ""}` }]);
      } else {
        setLog((l) => [...l, { me: false, text: j.error ?? "Assistant unavailable right now." }]);
      }
    } catch {
      setLog((l) => [...l, { me: false, text: "Assistant unavailable right now. Try again when online." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ir-ai">
      <div className="ir-ai-head">
        <div className="ir-ai-avatar" aria-hidden="true">🌺</div>
        <div><strong>IslandHelper</strong><br /><span style={{ fontSize: "0.82rem", color: "#bfe6e3" }}>Source-grounded · online only</span></div>
      </div>
      <div aria-live="polite" style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {log.map((m, i) => (
          <div key={i} className={m.me ? "ir-bubble-me" : "ir-bubble-ai"} style={{ whiteSpace: "pre-wrap" }}>
            {m.text}
          </div>
        ))}
        {busy ? <div className="ir-bubble-ai">Thinking — checking approved sources…</div> : null}
      </div>
      <div className="ir-topics" aria-label="Suggested questions">
        {CHIPS.map((c) => (
          <li key={c}><button type="button" onClick={() => ask(c)} disabled={busy}
            style={{ background: "none", border: 0, color: "inherit", font: "inherit", cursor: "pointer" }}>{c}</button></li>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
        <label htmlFor="ai-input" className="skip-link">Ask the assistant</label>
        <input id="ai-input" type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Try: What do we do right now?" aria-label="Ask the AI assistant"
          style={{ flex: 1, borderRadius: 10, border: "1px solid rgba(255,255,255,.3)", padding: "0.7rem 0.8rem" }} />
        <button type="submit" aria-label="Send" disabled={busy}
          style={{ borderRadius: 10, border: 0, background: "var(--sun)", fontWeight: 800, padding: "0 1.1rem", minWidth: 52, minHeight: 48 }}>➤</button>
      </form>
      <p className="ir-disclaimer">⚠️ Always follow official NEMO/CDEMA alerts. In immediate danger, call emergency services first.</p>
    </div>
  );
}
