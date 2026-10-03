// IslandReady AI — offline pack client store (Phase 9).
//
// LIFECYCLE + SECURITY (read before changing):
// - ONE versioned object per user: key `ir_pack_v1_<userId>`. No other pack keys.
// - localStorage is NOT a security boundary: minimum allowlist data only.
//   NEVER stored: passwords, session tokens, credentials, auth material,
//   secrets, AI answers, alerts/warnings/orders, shelter availability,
//   weather/operational status.
// - Namespacing prevents key collisions only; display ALSO requires
//   pack.userId === the signed-in user's id.
// - signOut clears the current user's pack (see dashboard signout-button).
// - Every offline view must show syncedAt + "not current" labeling (callers'
//   responsibility; OfflinePackView implements it).
// - Sync failures are returned honestly ({ok:false}) — never assume connectivity.
export interface OfflinePack {
  v: 1;
  userId: string;
  householdId: string;
  syncedAt: string;
  data: {
    household: { id: string; community: string; country: string; role: string };
    checklist: { item: string; done: boolean }[];
    score: { score: number; total: number; done: number; weightsVersion: string };
    familyPlan: unknown | null;
    supplyLists: unknown[];
  };
}

export function packKey(userId: string): string {
  return `ir_pack_v1_${userId}`;
}

async function getJSON(path: string): Promise<{ ok: boolean; status: number; body: unknown }> {
  try {
    const r = await fetch(path);
    let body: unknown = null;
    try {
      body = await r.json();
    } catch {
      body = null;
    }
    return { ok: r.ok, status: r.status, body };
  } catch {
    return { ok: false, status: 0, body: null };
  }
}

/** Sync the pack from live authenticated endpoints. Honest failures, no assumptions. */
export async function syncPack(
  userId: string,
  householdId: string
): Promise<{ ok: true; syncedAt: string } | { ok: false; reason: string }> {
  const base = `/api/households/${householdId}`;
  const [hh, check, score, fam, lists] = await Promise.all([
    getJSON("/api/households"),
    getJSON(`${base}/checklist`),
    getJSON(`${base}/score`),
    getJSON(`${base}/family-plan`),
    getJSON(`${base}/supplies/lists`),
  ]);
  for (const [name, r] of [["households", hh], ["checklist", check], ["score", score]] as const) {
    if (!r.ok) return { ok: false, reason: `${name} sync failed (status ${r.status || "network"}). Showing last-synced data if any.` };
  }
  const households = (hh.body as { households?: { id: string; community: string; country: string; role: string }[] }).households ?? [];
  const mine = households.find((h) => h.id === householdId);
  if (!mine) return { ok: false, reason: "Household not found for this user." };
  const state = (check.body as { state?: { item: string; done: boolean }[] }).state ?? [];
  const s = score.body as { score?: number; total?: number };
  // Family plan + supply lists are optional garnish: include when fetchable, else null/[].
  let familyPlan: unknown | null = null;
  if (fam.ok) {
    const b = fam.body as { plan?: unknown };
    familyPlan = b.plan ?? null;
  }
  let supplyLists: unknown[] = [];
  if (lists.ok) {
    const b = lists.body as { lists?: unknown[] };
    if (Array.isArray(b.lists)) supplyLists = b.lists;
  }
  const pack: OfflinePack = {
    v: 1,
    userId,
    householdId,
    syncedAt: new Date().toISOString(),
    data: {
      household: { id: mine.id, community: mine.community, country: mine.country, role: mine.role },
      checklist: state.map((r) => ({ item: String(r.item), done: r.done === true })),
      score: {
        score: typeof s.score === "number" ? s.score : 0,
        total: typeof s.total === "number" ? s.total : state.length,
        done: state.filter((r) => r.done === true).length,
        weightsVersion: "v1",
      },
      familyPlan,
      supplyLists,
    },
  };
  try {
    window.localStorage.setItem(packKey(userId), JSON.stringify(pack));
  } catch {
    return { ok: false, reason: "Device storage unavailable — pack not saved." };
  }
  return { ok: true, syncedAt: pack.syncedAt };
}

/** Read own pack only. Returns null unless the stored pack belongs to userId. */
export function readPack(userId: string): OfflinePack | null {
  try {
    const raw = window.localStorage.getItem(packKey(userId));
    if (!raw) return null;
    const pack = JSON.parse(raw) as OfflinePack;
    if (!pack || pack.v !== 1 || pack.userId !== userId) return null;
    return pack;
  } catch {
    return null;
  }
}

/** Clear the current user's pack (called on sign-out). */
export function clearPack(userId: string): void {
  try {
    window.localStorage.removeItem(packKey(userId));
  } catch {
    // best effort; stale keys never display without a matching session id.
  }
}
