"use client";
import { useState } from "react";

interface Org {
  id: string;
  name: string;
  kind: string;
  role: string;
}
interface Check {
  item: string;
  label: string;
  detail: string;
  done: boolean;
}

const KINDS = ["business", "school", "church", "hotel", "NGO", "government"];

export default function OrgManager({ initial }: { initial: Org[] }) {
  const [orgs, setOrgs] = useState<Org[]>(initial);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("business");
  const [openId, setOpenId] = useState<string | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);
  const [rollup, setRollup] = useState<{ done: number; total: number; percent: number } | null>(null);
  const [status, setStatus] = useState("");

  async function refresh() {
    const r = await fetch("/api/orgs");
    if (r.ok) setOrgs((await r.json()).orgs);
  }

  async function create() {
    if (!name.trim()) {
      setStatus("Give the organization a name first.");
      return;
    }
    const r = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, kind }),
    });
    const j = await r.json();
    setStatus(r.ok ? "✓ Organization created (you are owner)." : (j.error ?? "Could not create."));
    if (r.ok) {
      setName("");
      await refresh();
    }
  }

  async function open(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    const [c, g] = await Promise.all([
      fetch(`/api/orgs/${id}/checks`).then((r) => r.json()),
      fetch(`/api/orgs/${id}/rollup`).then((r) => r.json()),
    ]);
    setChecks(c.checks ?? []);
    setRollup(g.percent !== undefined ? g : null);
  }

  async function toggle(id: string, item: string, done: boolean) {
    await fetch(`/api/orgs/${id}/checks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, done }),
    });
    await open(id);
    await refresh();
  }

  return (
    <div>
      <section className="ir-card" aria-labelledby="org-new" style={{ marginBottom: "1rem" }}>
        <h2 id="org-new">New organization</h2>
        <label htmlFor="org-name">Name</label>
        <input id="org-name" type="text" value={name} placeholder="e.g. Castries Fish Market Assoc."
          onChange={(e) => setName(e.target.value)} />
        <label htmlFor="org-kind">Kind</label>
        <select id="org-kind" value={kind} onChange={(e) => setKind(e.target.value)}
          style={{ width: "100%", border: "1.5px solid #c8d9de", borderRadius: 12, padding: "0.7rem 0.8rem", fontSize: "1rem" }}>
          {KINDS.map((k) => (<option key={k} value={k}>{k}</option>))}
        </select>
        <p style={{ marginTop: "0.6rem" }}>
          <button className="ir-btn ir-btn-primary" style={{ width: "100%" }} type="button" onClick={create}>
            Create organization
          </button>
        </p>
      </section>

      <section className="ir-card" aria-labelledby="org-list">
        <h2 id="org-list">Your organizations</h2>
        {orgs.length === 0 ? <p className="ir-sub">None yet.</p> : null}
        <ul className="ir-check">
          {orgs.map((o) => (
            <li key={o.id}>
              <div style={{ flex: 1 }}>
                <strong>{o.name}</strong>
                <span style={{ display: "block", color: "var(--muted)", fontSize: "0.85rem" }}>
                  {o.kind} · your role: {o.role}
                </span>
                <button className="ir-btn ir-btn-secondary" style={{ minHeight: 40, marginTop: "0.4rem" }}
                  type="button" onClick={() => open(o.id)}>
                  {openId === o.id ? "Close" : "Open continuity plan"}
                </button>
                {openId === o.id ? (
                  <span style={{ display: "block", marginTop: "0.5rem" }}>
                    {rollup ? (
                      <p className="ir-gap">
                        🧪 <strong>Experimental roll-up:</strong> {rollup.done}/{rollup.total} checks
                        ({rollup.percent}%). Measures continuity-checklist completion only — not a
                        validated organizational-readiness standard.
                      </p>
                    ) : null}
                    <ul className="ir-check">
                      {checks.map((c) => (
                        <li key={c.item} className={c.done ? "done" : undefined}>
                          <input type="checkbox" id={`oc-${c.item}`} checked={c.done}
                            onChange={(e) => toggle(o.id, c.item, e.target.checked)} />
                          <label htmlFor={`oc-${c.item}`}><strong>{c.label}</strong><span>{c.detail}</span></label>
                        </li>
                      ))}
                    </ul>
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <p className="ir-hint" role="status">{status}</p>
    </div>
  );
}
