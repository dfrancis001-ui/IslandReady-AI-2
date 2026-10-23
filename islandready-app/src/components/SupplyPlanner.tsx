"use client";
import { useState } from "react";
import { calcSupplies, validateInputs, type CatalogRow } from "@/lib/supplies";

export interface CalcLine {
  key: string;
  label: string;
  qty: number;
  unit: string;
  unitPriceCents: number;
  lineTotalCents: number;
}
export interface SavedSummary {
  id: string;
  name: string;
  people: number;
  days: number;
  pricingVersion: number;
  totalCents: number;
}

function ec(cents: number): string {
  return `EC$${(cents / 100).toFixed(2)}`;
}

export default function SupplyPlanner({
  householdId,
  defaultPeople,
  initialLists,
  demo = false,
  demoCatalog,
}: {
  householdId: string;
  defaultPeople: number;
  initialLists: SavedSummary[];
  demo?: boolean;
  demoCatalog?: CatalogRow[];
}) {
  const [people, setPeople] = useState(String(defaultPeople));
  const [days, setDays] = useState("3");
  const [calc, setCalc] = useState<{ lines: CalcLine[]; totalCents: number } | null>(null);
  const [name, setName] = useState("");
  const [lists, setLists] = useState<SavedSummary[]>(initialLists);
  const [status, setStatus] = useState("");

  async function calculate() {
    if (demo) {
      const v = validateInputs(Number(people), Number(days));
      if (v.error || !v.clean) {
        setStatus(v.error ?? "Invalid inputs.");
        return;
      }
      if (!demoCatalog) {
        setStatus("Demo catalog unavailable.");
        return;
      }
      const result = calcSupplies(demoCatalog, v.clean.people, v.clean.days);
      setCalc({ lines: result.lines, totalCents: result.totalCents });
      setStatus("Demo calculation only — nothing is saved.");
      return;
    }
    setStatus("Calculating…");
    const r = await fetch(`/api/households/${householdId}/supplies/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ people: Number(people), days: Number(days) }),
    });
    const j = await r.json();
    if (!r.ok) {
      setStatus(j.error ?? "Could not calculate.");
      return;
    }
    setCalc(j);
    setStatus("");
  }

  async function refreshLists() {
    if (demo) return;
    const r = await fetch(`/api/households/${householdId}/supplies/lists`);
    if (r.ok) setLists((await r.json()).lists);
  }

  async function save() {
    if (!name.trim()) {
      setStatus("Give the list a name first.");
      return;
    }
    if (demo) {
      const v = validateInputs(Number(people), Number(days));
      if (v.error || !v.clean) {
        setStatus(v.error ?? "Invalid inputs.");
        return;
      }
      if (!demoCatalog) {
        setStatus("Demo catalog unavailable.");
        return;
      }
      const result = calcSupplies(demoCatalog, v.clean.people, v.clean.days);
      setLists([
        {
          id: `demo-list-${Date.now()}`,
          name: name.trim(),
          people: v.clean.people,
          days: v.clean.days,
          pricingVersion: result.version,
          totalCents: result.totalCents,
        },
        ...lists,
      ]);
      setName("");
      setStatus("Demo list saved for this browser session only — not persisted.");
      return;
    }
    setStatus("Saving…");
    const r = await fetch(`/api/households/${householdId}/supplies/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, people: Number(people), days: Number(days) }),
    });
    const j = await r.json();
    if (!r.ok) {
      setStatus(j.error ?? "Could not save.");
      return;
    }
    setName("");
    setStatus("✓ Shopping list saved (prices snapshotted).");
    await refreshLists();
  }

  async function remove(id: string, listName: string) {
    if (!window.confirm(`Delete “${listName}”?`)) return;
    if (demo) {
      setLists(lists.filter((l) => l.id !== id));
      setStatus("Demo list removed from this browser session.");
      return;
    }
    const r = await fetch(`/api/households/${householdId}/supplies/lists/${id}`, { method: "DELETE" });
    setStatus(r.ok ? "List deleted." : "Could not delete.");
    await refreshLists();
  }

  async function load(id: string) {
    if (demo) {
      const l = lists.find((x) => x.id === id);
      if (!l) {
        setStatus("Could not load list.");
        return;
      }
      setPeople(String(l.people));
      setDays(String(l.days));
      setName(l.name);
      if (demoCatalog) {
        const result = calcSupplies(demoCatalog, l.people, l.days);
        setCalc({ lines: result.lines, totalCents: result.totalCents });
      }
      setStatus("Demo list loaded for this session.");
      return;
    }
    const r = await fetch(`/api/households/${householdId}/supplies/lists/${id}`);
    if (!r.ok) {
      setStatus("Could not load list.");
      return;
    }
    const j = await r.json();
    setPeople(String(j.list.people));
    setDays(String(j.list.days));
    setName(j.list.name);
    await calculate();
  }

  return (
    <div className="ir-form">
      <section className="ir-card" aria-labelledby="calc-title" style={{ marginBottom: "1rem" }}>
        <h2 id="calc-title">1–2. People &amp; days</h2>
        <p className="ir-sub">
          Baseline planning rates (PRD/prototype v1 — not surveyed retail prices).
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          <div>
            <label htmlFor="sp-people">People (1–30)</label>
            <input id="sp-people" type="text" inputMode="numeric" value={people}
              onChange={(e) => setPeople(e.target.value)} />
          </div>
          <div>
            <label htmlFor="sp-days">Days (1–30)</label>
            <input id="sp-days" type="text" inputMode="numeric" value={days}
              onChange={(e) => setDays(e.target.value)} />
          </div>
        </div>
        <p style={{ marginTop: "0.8rem" }}>
          <button className="ir-btn ir-btn-primary" style={{ width: "100%" }} type="button" onClick={calculate}>
            Calculate supply plan
          </button>
        </p>
      </section>

      {calc ? (
        <section className="ir-card" aria-labelledby="plan-title" style={{ marginBottom: "1rem" }}>
          <h2 id="plan-title">3–4. Supply plan &amp; estimated total</h2>
          <table className="ir-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead>
            <tbody>
              {calc.lines.map((l) => (
                <tr key={l.key}>
                  <td>{l.label}<br /><span className="ir-hint">{l.qty} {l.unit}</span></td>
                  <td>{l.qty}</td>
                  <td>{ec(l.unitPriceCents)}</td>
                  <td>{ec(l.lineTotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ir-gap" style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
            <span>Estimated total</span><span>{ec(calc.totalCents)}</span>
          </div>
          <label htmlFor="sp-name" style={{ marginTop: "0.8rem" }}>5. List name, then save</label>
          <input id="sp-name" type="text" value={name} placeholder="e.g. Hurricane kit — June"
            onChange={(e) => setName(e.target.value)} />
          <p style={{ marginTop: "0.6rem" }}>
            <button className="ir-btn ir-btn-secondary" style={{ width: "100%" }} type="button" onClick={save}>
              Save shopping list
            </button>
          </p>
        </section>
      ) : null}

      <p className="ir-hint" role="status">{status}</p>

      <section className="ir-card" aria-labelledby="saved-title">
        <h2 id="saved-title">Saved lists</h2>
        {lists.length === 0 ? (
          <p className="ir-sub">No saved lists yet.</p>
        ) : (
          <ul className="ir-check">
            {lists.map((l) => (
              <li key={l.id}>
                <div style={{ flex: 1 }}>
                  <strong>{l.name}</strong>
                  <span style={{ display: "block", color: "var(--muted)", fontSize: "0.85rem" }}>
                    {l.people} people · {l.days} days · {ec(l.totalCents)} · prices v{l.pricingVersion}
                  </span>
                  <span style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                    <button className="ir-btn ir-btn-secondary" style={{ minHeight: 40, padding: "0.4rem 0.8rem" }} type="button" onClick={() => load(l.id)}>Load</button>
                    <button className="ir-btn ir-btn-secondary" style={{ minHeight: 40, padding: "0.4rem 0.8rem" }} type="button" onClick={() => remove(l.id, l.name)}>Delete</button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
