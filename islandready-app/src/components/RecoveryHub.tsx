"use client";
import { useState } from "react";

interface Rec {
  id: string;
  title: string;
  note: string;
  hasPhoto: boolean;
}
interface Task {
  id: number;
  label: string;
  done: boolean;
}

export type { Rec, Task };

export default function RecoveryHub({
  householdId,
  initialRecords,
  initialTasks,
  uploadsEnabled = true,
}: {
  householdId: string;
  initialRecords: Rec[];
  initialTasks: Task[];
  uploadsEnabled?: boolean;
}) {
  const [records, setRecords] = useState<Rec[]>(initialRecords);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [taskLabel, setTaskLabel] = useState("");
  const [status, setStatus] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const base = `/api/households/${householdId}/recovery`;

  async function refresh() {
    const [rr, tt] = await Promise.all([
      fetch(`${base}/records`).then((r) => r.json()),
      fetch(`${base}/tasks`).then((r) => r.json()),
    ]);
    setRecords(rr.records ?? []);
    setTasks(tt.tasks ?? []);
  }

  async function addRecord() {
    if (!title.trim()) {
      setStatus("Give the record a title first.");
      return;
    }
    const r = await fetch(`${base}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, note }),
    });
    if (!r.ok) {
      setStatus("Could not create record.");
      return;
    }
    setTitle("");
    setNote("");
    setStatus("✓ Damage record saved.");
    await refresh();
  }

  async function removeRecord(id: string, recordTitle: string) {
    if (!window.confirm(`Delete “${recordTitle}” and its photo?`)) return;
    const r = await fetch(`${base}/records/${id}`, { method: "DELETE" });
    setStatus(r.ok ? "Record deleted." : "Could not delete.");
    if (openId === id) setOpenId(null);
    await refresh();
  }

  async function uploadPhoto(id: string, file: File) {
    const form = new FormData();
    form.append("photo", file);
    const r = await fetch(`${base}/records/${id}/photo`, { method: "POST", body: form });
    const j = await r.json();
    setStatus(r.ok ? "✓ Photo saved (metadata stripped)." : (j.error ?? "Could not save photo."));
    await refresh();
  }

  async function addTask() {
    if (!taskLabel.trim()) {
      setStatus("Give the task a label first.");
      return;
    }
    const r = await fetch(`${base}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: taskLabel }),
    });
    if (!r.ok) {
      setStatus("Could not add task.");
      return;
    }
    setTaskLabel("");
    await refresh();
  }

  async function toggleTask(t: Task) {
    await fetch(`${base}/tasks/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    });
    await refresh();
  }

  async function removeTask(t: Task) {
    await fetch(`${base}/tasks/${t.id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div>
      <section className="ir-card" aria-labelledby="recs-title" style={{ marginBottom: "1rem" }}>
        <h2 id="recs-title">Damage records</h2>
        {!uploadsEnabled ? (
          <p className="ir-hint" role="status">📷 Photo uploads are temporarily unavailable in this deployment. Records and tasks below work normally.</p>
        ) : null}
        <p className="ir-sub">Your notes and photos, organized for assistance or insurance use. Never shared automatically.</p>
        {records.length === 0 ? <p className="ir-sub">No damage records yet.</p> : null}
        <ul className="ir-check">
          {records.map((r) => (
            <li key={r.id} className={openId === r.id ? "done" : undefined}>
              <div style={{ flex: 1 }}>
                <strong>{r.title}</strong>
                <span style={{ display: "block", color: "var(--muted)", fontSize: "0.85rem" }}>
                  {r.note || "No note"} · {r.hasPhoto ? "📷 photo attached" : "no photo"}
                </span>
                <span style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                  <button className="ir-btn ir-btn-secondary" style={{ minHeight: 40, padding: "0.4rem 0.8rem" }} type="button"
                    onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                    {openId === r.id ? "Close" : "Open"}
                  </button>
                  <button className="ir-btn ir-btn-secondary" style={{ minHeight: 40, padding: "0.4rem 0.8rem" }} type="button"
                    onClick={() => removeRecord(r.id, r.title)}>Delete</button>
                </span>
                {openId === r.id ? (
                  <span style={{ display: "block", marginTop: "0.5rem" }}>
                    {r.hasPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`${base}/records/${r.id}/photo`} alt={`Damage photo for ${r.title}`}
                        style={{ maxWidth: "100%", borderRadius: 12 }} />
                    ) : uploadsEnabled ? (
                      <label>Attach photo (JPEG/PNG, max 5 MB; location metadata is removed):
                        <input type="file" accept="image/jpeg,image/png" style={{ display: "block", marginTop: "0.3rem" }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadPhoto(r.id, f);
                            e.target.value = "";
                          }} />
                      </label>
                    ) : (
                      <p className="ir-hint">📷 Photo uploads are temporarily unavailable in this deployment. Records and tasks below work normally.</p>
                    )}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        <label htmlFor="rr-title">New record title</label>
        <input id="rr-title" type="text" value={title} placeholder="e.g. Roof leak, north bedroom"
          onChange={(e) => setTitle(e.target.value)} />
        <label htmlFor="rr-note">Note</label>
        <input id="rr-note" type="text" value={note} placeholder="e.g. photo taken, water entering at seam"
          onChange={(e) => setNote(e.target.value)} />
        <p style={{ marginTop: "0.6rem" }}>
          <button className="ir-btn ir-btn-primary" style={{ width: "100%" }} type="button" onClick={addRecord}>
            ＋ Add damage record
          </button>
        </p>
      </section>

      <section className="ir-card" aria-labelledby="tasks-title" style={{ marginBottom: "1rem" }}>
        <h2 id="tasks-title">Recovery tasks</h2>
        {tasks.length === 0 ? <p className="ir-sub">No recovery tasks yet.</p> : null}
        <ul className="ir-check">
          {tasks.map((t) => (
            <li key={t.id} className={t.done ? "done" : undefined}>
              <input type="checkbox" id={`rt-${t.id}`} checked={t.done} onChange={() => toggleTask(t)} />
              <label htmlFor={`rt-${t.id}`}><strong>{t.label}</strong></label>
              <button className="ir-btn ir-btn-secondary" style={{ minHeight: 36, padding: "0.3rem 0.7rem", marginLeft: "auto" }}
                type="button" onClick={() => removeTask(t)}>✕</button>
            </li>
          ))}
        </ul>
        <label htmlFor="rt-new">New task</label>
        <input id="rt-new" type="text" value={taskLabel} placeholder="e.g. Call roofer for quote"
          onChange={(e) => setTaskLabel(e.target.value)} />
        <p style={{ marginTop: "0.6rem" }}>
          <button className="ir-btn ir-btn-secondary" style={{ width: "100%" }} type="button" onClick={addTask}>
            ＋ Add task
          </button>
        </p>
      </section>

      <section className="ir-card" aria-labelledby="assist-title">
        <h2 id="assist-title">🤝 Official assistance information</h2>
        <p className="ir-sub">
          Static contact information only — not live aid availability, eligibility, or benefit
          amounts. Contact the organizations directly for current assistance.
        </p>
        <ul>
          <li>📞 NEMO Saint Lucia — 452-3802</li>
          <li>🤝 Red Cross Saint Lucia — 758-452-5583</li>
          <li>🏥 Castries Hospital — 758-458-6700</li>
        </ul>
      </section>

      <p className="ir-hint" role="status">{status}</p>
    </div>
  );
}
