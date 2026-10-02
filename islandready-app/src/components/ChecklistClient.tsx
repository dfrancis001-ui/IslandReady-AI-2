"use client";
import { useState } from "react";

export interface ChecklistItem {
  key: string;
  title: string;
  detail: string;
}

export default function ChecklistClient({
  householdId,
  items,
  initialDone,
}: {
  householdId: string;
  items: ChecklistItem[];
  initialDone: string[];
}) {
  const [done, setDone] = useState<Set<string>>(new Set(initialDone));
  const [score, setScore] = useState<number | null>(null);
  const [status, setStatus] = useState("");

  async function refreshScore(next: Set<string>) {
    // Score is derived server-side from live DB state; this just re-reads it.
    const r = await fetch(`/api/households/${householdId}/score`);
    if (r.ok) {
      const j = await r.json();
      setScore(j.score);
    }
    void next;
  }

  async function toggle(key: string, to: boolean) {
    setStatus("Saving…");
    const r = await fetch(`/api/households/${householdId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item: key, done: to }),
    });
    if (!r.ok) {
      setStatus(r.status === 404 ? "Not found." : "Could not save — try again.");
      return;
    }
    const next = new Set(done);
    if (to) next.add(key);
    else next.delete(key);
    setDone(next);
    setStatus(to ? "Saved ✓" : "Unchecked — saved.");
    await refreshScore(next);
  }

  const pct = Math.round((100 * done.size) / items.length);
  return (
    <>
      <p className="ir-sub">
        Hurricane &amp; flood plan · <strong>{done.size} of {items.length} complete</strong>
        {score !== null ? <> · <strong>Score: {score}%</strong></> : null}
      </p>
      <div className="ir-progress" role="progressbar" aria-valuenow={done.size} aria-valuemin={0} aria-valuemax={items.length} aria-label="Checklist progress">
        <span style={{ width: `${pct}%` }} />
      </div>
      <ul className="ir-check">
        {items.map((i) => (
          <li key={i.key} className={done.has(i.key) ? "done" : undefined}>
            <input
              type="checkbox"
              id={`c-${i.key}`}
              checked={done.has(i.key)}
              onChange={(e) => toggle(i.key, e.target.checked)}
            />
            <label htmlFor={`c-${i.key}`}>
              <strong>{i.title}</strong>
              <span>{i.detail}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="ir-hint" role="status">{status}</p>
    </>
  );
}
