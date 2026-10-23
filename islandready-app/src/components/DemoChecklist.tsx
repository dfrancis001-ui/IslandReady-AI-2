"use client";
import { useState } from "react";

// Public assessor-demo checklist. Entirely client-side: no API calls, no
// session, no database — checking items only updates local React state.

interface DemoItem {
  key: string;
  title: string;
  detail: string;
}

const ITEMS: DemoItem[] = [
  {
    key: "water",
    title: "Store drinking water",
    detail: "Plan at least 4 litres per person per day for 3–7 days.",
  },
  {
    key: "food",
    title: "Pack non-perishable food",
    detail: "Canned and dry goods for 3–7 days, plus a manual can opener.",
  },
  {
    key: "meds",
    title: "Gather medicines and first aid",
    detail: "Prescriptions, pain relief, bandages and antiseptic.",
  },
  {
    key: "docs",
    title: "Protect important documents",
    detail: "IDs, insurance and property records in a waterproof bag.",
  },
  {
    key: "comms",
    title: "Charge phones and backup power",
    detail: "Power bank, torch, spare batteries and a battery radio.",
  },
  {
    key: "plan",
    title: "Agree a family meeting place",
    detail: "Choose one place near home and one outside your area.",
  },
  {
    key: "evac",
    title: "Know your evacuation route",
    detail: "Identify your nearest shelter and the safest route there.",
  },
  {
    key: "contacts",
    title: "Share emergency contacts",
    detail: "Store one local and one out-of-area contact.",
  },
];

export default function DemoChecklist() {
  const [done, setDone] = useState<Set<string>>(new Set());

  function toggle(key: string, to: boolean) {
    setDone((prev) => {
      const next = new Set(prev);
      if (to) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  const pct = Math.round((done.size / ITEMS.length) * 100);

  return (
    <div>
      <p className="ir-sub">
        <strong>{done.size} of {ITEMS.length}</strong> sample tasks complete ·{" "}
        <strong>{pct}%</strong>
      </p>
      <div
        className="ir-progress"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Demo checklist progress"
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <ul className="ir-check">
        {ITEMS.map((i) => (
          <li key={i.key} className={done.has(i.key) ? "done" : undefined}>
            <input
              type="checkbox"
              id={`demo-${i.key}`}
              checked={done.has(i.key)}
              onChange={(e) => toggle(i.key, e.target.checked)}
            />
            <label htmlFor={`demo-${i.key}`}>
              <strong>{i.title}</strong>
              <span>{i.detail}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="ir-hint">
        Demo only — nothing is saved or sent anywhere. In the full app, checklist
        progress is stored privately in your own household.
      </p>
    </div>
  );
}
