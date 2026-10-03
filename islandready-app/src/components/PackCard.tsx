"use client";
import { useState } from "react";
import { clearPack, readPack, syncPack, type OfflinePack } from "@/lib/offline-pack";

export default function PackCard({
  userId,
  householdId,
}: {
  userId: string;
  householdId: string;
}) {
  const [status, setStatus] = useState("");
  const [syncedAt, setSyncedAt] = useState<string | null>(() => {
    try {
      return readPack(userId)?.syncedAt ?? null;
    } catch {
      return null;
    }
  });

  async function onSync() {
    setStatus("Syncing…");
    const r = await syncPack(userId, householdId);
    if (r.ok) {
      setSyncedAt(r.syncedAt);
      setStatus("✓ Offline pack saved on this device.");
    } else {
      setStatus(r.reason);
    }
  }

  return (
    <section className="ir-card" aria-labelledby="pack-title">
      <h2 id="pack-title">📴 Offline Emergency Pack</h2>
      <p className="ir-sub">
        Device-local copy of your essentials (household, checklist, score, family plan,
        supply lists). Last synced: <strong>{syncedAt ?? "never"}</strong>. Offline
        content is previously synced data — never current operational information.
      </p>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button className="ir-btn ir-btn-primary" type="button" onClick={onSync}>
          Save offline pack
        </button>
        <button className="ir-btn ir-btn-secondary" type="button"
          onClick={() => { clearPack(userId); setSyncedAt(null); setStatus("Pack cleared from this device."); }}>
          Clear pack
        </button>
      </div>
      <p className="ir-hint" role="status">{status}</p>
    </section>
  );
}

export function packForView(userId: string): OfflinePack | null {
  return readPack(userId);
}
