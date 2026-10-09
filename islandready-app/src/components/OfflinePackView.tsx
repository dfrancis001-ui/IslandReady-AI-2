"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readPack, type OfflinePack } from "@/lib/offline-pack";

export default function OfflinePackView({ userId }: { userId: string }) {
  const [pack, setPack] = useState<OfflinePack | null>(null);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setPack(readPack(userId));
    });
    return () => cancelAnimationFrame(raf);
  }, [userId]);
  if (!pack) {
    return (
      <div className="ir-shell">
        <h2 style={{ marginTop: 0 }}>No offline pack on this device</h2>
        <p className="ir-sub">
          Connect, open your dashboard, and use “Save offline pack” to store a
          device-local copy of your essentials.
        </p>
        <p><Link href="/dashboard">← Back to dashboard</Link></p>
      </div>
    );
  }
  const done = pack.data.checklist.filter((c) => c.done).length;
  return (
    <div className="ir-shell">
      <h2 style={{ marginTop: 0 }}>📴 Offline essentials <span className="ir-phase-tag">last synced {pack.syncedAt}</span></h2>
      <p className="ir-sub">
        Device-local, previously synced data for {pack.data.household.community}.
        <strong> Not current operational information.</strong> For live alerts, warnings,
        shelter status, or AI help, reconnect and use official NEMO/CDEMA channels.
      </p>
      <dl className="ir-kv">
        <div><dt>Household</dt><dd>{pack.data.household.community} · {pack.data.household.role}</dd></div>
        <div><dt>Readiness</dt><dd>{pack.data.score.score}% · {done}/{pack.data.checklist.length} items</dd></div>
        <div><dt>Family plan</dt><dd>{pack.data.familyPlan ? "saved" : "not saved"}</dd></div>
        <div><dt>Supply lists</dt><dd>{Array.isArray(pack.data.supplyLists) ? pack.data.supplyLists.length : 0} saved</dd></div>
      </dl>
      <h3>Checklist state at last sync</h3>
      <ul className="ir-check">
        {pack.data.checklist.map((c) => (
          <li key={c.item} className={c.done ? "done" : undefined}>
            <span aria-hidden="true">{c.done ? "✓" : "○"}</span>
            <label><strong>{c.item.replace(/_/g, " ")}</strong></label>
          </li>
        ))}
      </ul>
      <p><Link href="/dashboard">← Back to dashboard</Link></p>
    </div>
  );
}
