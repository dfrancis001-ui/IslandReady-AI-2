"use client";
import { useState } from "react";

export interface PlanContact {
  label: string;
  phone: string;
  note: string;
}
export interface PlanRole {
  member: string;
  responsibility: string;
}
export interface PlanData {
  meetingPoint: string;
  backupMeetingPoint: string;
  evacuationInfo: string;
  commsPlan: string;
  nextSteps: string;
  contacts: PlanContact[];
  roles: PlanRole[];
}

const EMPTY: PlanData = {
  meetingPoint: "",
  backupMeetingPoint: "",
  evacuationInfo: "",
  commsPlan: "",
  nextSteps: "",
  contacts: [{ label: "", phone: "", note: "" }],
  roles: [{ member: "", responsibility: "" }],
};

export default function FamilyPlanForm({
  householdId,
  initial,
}: {
  householdId: string;
  initial: PlanData | null;
}) {
  const [form, setForm] = useState<PlanData>(initial ?? EMPTY);
  const [status, setStatus] = useState(
    initial ? "Loaded from your household record." : "No plan saved yet — fill in and save."
  );

  function set<K extends keyof PlanData>(key: K, value: PlanData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setStatus("Saving…");
    const r = await fetch(`/api/households/${householdId}/family-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await r.json();
    setStatus(r.ok ? "✓ Family plan saved." : (j.error ?? "Could not save — check the fields."));
  }

  return (
    <div className="ir-form">
      <section className="ir-card" aria-labelledby="who-title" style={{ marginBottom: "1rem" }}>
        <h2 id="who-title">WHO — emergency contacts</h2>
        {form.contacts.map((c, i) => (
          <div key={i} style={{ display: "grid", gap: "0.4rem", marginBottom: "0.8rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.8rem" }}>
            <label htmlFor={`c-label-${i}`}>Contact {i + 1} — name / relation</label>
            <input id={`c-label-${i}`} type="text" value={c.label} placeholder="e.g. Mom (lead)"
              onChange={(e) => set("contacts", form.contacts.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <label htmlFor={`c-phone-${i}`}>Phone</label>
            <input id={`c-phone-${i}`} type="text" value={c.phone} placeholder="e.g. 758-555-0142" inputMode="tel"
              onChange={(e) => set("contacts", form.contacts.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)))} />
            <label htmlFor={`c-note-${i}`}>Note (optional)</label>
            <input id={`c-note-${i}`} type="text" value={c.note} placeholder="e.g. out-of-island"
              onChange={(e) => set("contacts", form.contacts.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
            {form.contacts.length > 1 ? (
              <button className="ir-btn ir-btn-secondary" type="button"
                onClick={() => set("contacts", form.contacts.filter((_, j) => j !== i))}>Remove contact</button>
            ) : null}
          </div>
        ))}
        {form.contacts.length < 10 ? (
          <button className="ir-btn ir-btn-secondary" type="button"
            onClick={() => set("contacts", [...form.contacts, { label: "", phone: "", note: "" }])}>
            ＋ Add contact
          </button>
        ) : null}
      </section>

      <section className="ir-card" aria-labelledby="where-title" style={{ marginBottom: "1rem" }}>
        <h2 id="where-title">WHERE — meeting points &amp; evacuation</h2>
        <label htmlFor="f-meet">Primary meeting point (required)</label>
        <input id="f-meet" type="text" value={form.meetingPoint} placeholder="e.g. St. Jude's Church hall · Castries"
          onChange={(e) => set("meetingPoint", e.target.value)} />
        <label htmlFor="f-backup">Backup meeting point</label>
        <input id="f-backup" type="text" value={form.backupMeetingPoint} placeholder="e.g. uphill, no flood zone"
          onChange={(e) => set("backupMeetingPoint", e.target.value)} />
        <label htmlFor="f-evac">Evacuation information</label>
        <input id="f-evac" type="text" value={form.evacuationInfo} placeholder="e.g. route, transport, shelter list location"
          onChange={(e) => set("evacuationInfo", e.target.value)} />
      </section>

      <section className="ir-card" aria-labelledby="what-title" style={{ marginBottom: "1rem" }}>
        <h2 id="what-title">WHAT NEXT — roles, comms &amp; actions</h2>
        {form.roles.map((r, i) => (
          <div key={i} style={{ display: "grid", gap: "0.4rem", marginBottom: "0.8rem", borderBottom: "1px solid var(--line)", paddingBottom: "0.8rem" }}>
            <label htmlFor={`r-member-${i}`}>Family member {i + 1}</label>
            <input id={`r-member-${i}`} type="text" value={r.member} placeholder="e.g. Dad"
              onChange={(e) => set("roles", form.roles.map((x, j) => (j === i ? { ...x, member: e.target.value } : x)))} />
            <label htmlFor={`r-resp-${i}`}>Responsibility</label>
            <input id={`r-resp-${i}`} type="text" value={r.responsibility} placeholder="e.g. shutters and outdoor items"
              onChange={(e) => set("roles", form.roles.map((x, j) => (j === i ? { ...x, responsibility: e.target.value } : x)))} />
            {form.roles.length > 1 ? (
              <button className="ir-btn ir-btn-secondary" type="button"
                onClick={() => set("roles", form.roles.filter((_, j) => j !== i))}>Remove role</button>
            ) : null}
          </div>
        ))}
        {form.roles.length < 12 ? (
          <button className="ir-btn ir-btn-secondary" type="button"
            onClick={() => set("roles", [...form.roles, { member: "", responsibility: "" }])}>
            ＋ Add role
          </button>
        ) : null}
        <label htmlFor="f-comms">Communication plan</label>
        <input id="f-comms" type="text" value={form.commsPlan} placeholder="e.g. group text, then radio check at :00"
          onChange={(e) => set("commsPlan", e.target.value)} />
        <label htmlFor="f-next">Emergency actions / next steps</label>
        <input id="f-next" type="text" value={form.nextSteps} placeholder="e.g. secure home, grab baby bag, confirm meeting point"
          onChange={(e) => set("nextSteps", e.target.value)} />
      </section>

      <button className="ir-btn ir-btn-primary" style={{ width: "100%" }} type="button" onClick={save}>
        Save Family Plan
      </button>
      <p className="ir-hint" role="status">{status}</p>
    </div>
  );
}
