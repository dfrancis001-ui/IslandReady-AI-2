import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { myHouseholds } from "@/lib/households";
import {
  biggestGap,
  nextBestActions,
  score,
  subScores,
  type CategoryRow,
  type ItemRow,
} from "@/lib/scoring";
import EmergencyStrip from "@/components/EmergencyStrip";
import NbaCard from "@/components/NbaCard";
import PackCard from "@/components/PackCard";
import ScoreRing from "@/components/ScoreRing";
import SiteHeader from "@/components/SiteHeader";
import SignOutButton from "./signout-button";

export const dynamic = "force-dynamic";

const CAT_LABELS: Record<string, string> = {
  food: "Food",
  water: "Water",
  medical: "Medical",
  comms: "Comms",
  documents: "Docs",
  power: "Power",
  home_prep: "Home",
  evacuation: "Evac",
  contacts: "Contacts",
  recovery: "Recovery",
};

function statusFor(s: number): string {
  if (s >= 80) return "Strong";
  if (s >= 50) return "Getting there";
  return "Getting started";
}

function readinessBadge(pct: number): { text: string; cls: string } {
  if (pct >= 80) return { text: "READY", cls: "ir-badge-good" };
  if (pct >= 50) return { text: "IN PROGRESS", cls: "ir-badge-info" };
  return { text: "TO DO", cls: "ir-badge-watch" };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");
  // Phase 4: first owner household (no switcher yet).
  const households = await myHouseholds(userId);
  if (households.length === 0) redirect("/signup");
  const household = households[0];

  const cats = (await query('SELECT "key", label, weight FROM readiness_categories ORDER BY "key"'))
    .rows as CategoryRow[];
  const items = (
    await query('SELECT "key", category_key AS category, title, tags FROM checklist_items ORDER BY "key"')
  ).rows as ItemRow[];
  const doneRows = (await query(
    "SELECT item_key FROM household_checklist_state WHERE household_id = $1 AND done = TRUE",
    [household.id]
  )) as unknown as { rows: { item_key: string }[] };
  const done = new Set(doneRows.rows.map((r) => r.item_key));

  const s = score(cats, items, done);
  const subs = subScores(cats, items, done);
  const gap = biggestGap(cats, items, done);
  const gapLabel = cats.find((c) => c.key === gap)?.label ?? gap;

  const needs = new Set<string>();
  interface NeedFlags {
    baby: boolean;
    elderly: boolean;
    mobility: boolean;
    pets: boolean;
  }
  let flags: NeedFlags | null = null;
  try {
    const res = await query(
      "SELECT baby, elderly, mobility, pets FROM household_need_flags WHERE household_id = $1",
      [household.id]
    );
    const rows = res.rows as NeedFlags[];
    flags = rows[0] ?? null;
    if (flags) {
      for (const k of ["baby", "elderly", "mobility", "pets"] as const) {
        if (flags[k]) needs.add(k);
      }
    }
  } catch {
    // flags view is optional garnish; scoring never depends on it.
  }
  const actions = nextBestActions(cats, items, done, needs);

  const memberRows = (await query(
    "SELECT age_group, COUNT(*)::int AS n FROM household_members WHERE household_id = $1 GROUP BY age_group ORDER BY age_group",
    [household.id]
  )) as unknown as { rows: { age_group: string; n: number }[] };
  const memberCount = memberRows.rows.reduce((t, r) => t + r.n, 0);

  const supplyKeys = ["water", "food", "medical", "power"] as const;
  const recoveryDone = done.has("photo_home");
  const evacDone = done.has("evac_route") && done.has("meeting_point");

  return (
    <>
      <SiteHeader active="/dashboard" />
      <main className="ir-main" id="main">
        <section className="ir-hero" aria-labelledby="hero-title">
          <div className="ir-hero-grid">
            <div>
              <span className="ir-eyebrow">🌴 Caribbean-first · Saint Lucia pilot</span>
              <h2 id="hero-title">
                You&apos;re {s}% ready.<br />Let&apos;s close the last gap — together.
              </h2>
              <p>
                Every Caribbean household can answer: <strong>WHO</strong> do I contact?{" "}
                <strong>WHERE</strong> do we go? <strong>WHAT</strong> do we do next? IslandReady
                turns alerts into a calm, personal 72-hour plan.
              </p>
              <div className="ir-hero-cta">
                <Link className="ir-btn ir-btn-primary" href="/checklist">Start Next Action →</Link>
                <Link className="ir-btn" style={{ background: "rgba(255,255,255,.14)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }} href="/assistant">Ask AI Assistant</Link>
              </div>
              <p style={{ margin: "0.7rem 0 0", fontSize: "0.85rem", color: "#bfe6e3" }}>
                Hurricane &amp; flood plan · <strong style={{ color: "#fff" }}>{done.size} of {items.length} complete</strong> · {household.community} · <SignOutButton userId={userId} />
              </p>
            </div>
            <div className="ir-risk" aria-label="Weather and risk status">
              <h3>📡 Weather &amp; Risk — {household.community}</h3>
              <div className="ir-risk-row"><span>🌀 Hurricane season prep</span><span className="ir-badge ir-badge-watch">SEASON</span></div>
              <div className="ir-risk-row"><span>🌊 Flood / landslide readiness</span><span className="ir-badge ir-badge-info">{subs["home_prep"]}%</span></div>
              <div className="ir-risk-row"><span>🔋 Power outage readiness</span><span className="ir-badge ir-badge-info">{subs["power"]}%</span></div>
              <div className="ir-risk-row"><span>🏠 Your completion</span><span className="ir-badge ir-badge-good">{done.size}/{items.length} DONE</span></div>
              <p className="ir-hint">Static context, not a live alert. Always follow official NEMO / CDEMA / Met Services alerts.</p>
            </div>
          </div>
        </section>

        <div className="ir-grid">
          <section className="ir-card" aria-labelledby="score-title">
            <h2 id="score-title">Readiness Score</h2>
            <p className="ir-sub">Food, water, medical, comms, documents, power, home, evacuation &amp; recovery.</p>
            <div className="ir-score-wrap">
              <ScoreRing score={s} />
              <div className="ir-score-text">
                <strong>{s}%</strong>{" "}
                <span className={`ir-badge ${s >= 80 ? "ir-badge-good" : s >= 50 ? "ir-badge-info" : "ir-badge-watch"}`}>
                  {statusFor(s).toUpperCase()}
                </span>
                <p className="ir-sub" style={{ margin: "0.2rem 0" }}>
                  Biggest gap: <strong style={{ color: "#0a4d5a" }}>{gapLabel}</strong>.
                </p>
              </div>
            </div>
            <div className="ir-progress" aria-hidden="true"><span style={{ width: `${s}%` }} /></div>
            <div className="ir-minibars" aria-label="Per-category readiness">
              {cats.map((c) => (
                <div className="ir-minibar" key={c.key}>
                  <span>{CAT_LABELS[c.key] ?? c.key}</span>
                  <span className="ir-track"><span className="ir-fill" style={{ width: `${subs[c.key]}%` }} /></span>
                  <b>{subs[c.key]}%</b>
                </div>
              ))}
            </div>
            <p className="ir-gap" style={{ marginTop: "0.7rem" }}>
              💬 <strong>Insight:</strong>{" "}
              {actions.length === 0
                ? "Full checklist complete. Run a family drill to stay sharp."
                : `Biggest gap is ${gapLabel.toLowerCase()}. Start with “${actions[0].title}”.`}{" "}
              <Link href="/checklist">Open checklist →</Link>
            </p>
          </section>

          <NbaCard actions={actions} />

          <section className="ir-card" aria-labelledby="ai-teaser-title">
            <h2 id="ai-teaser-title">🤖 AI Emergency Assistant</h2>
            <p className="ir-sub">Calm, source-grounded answers. Never replaces official instructions.</p>
            <div className="ir-ai">
              <div className="ir-ai-head">
                <div className="ir-ai-avatar" aria-hidden="true">🌺</div>
                <div><strong>IslandHelper</strong><br /><span style={{ fontSize: "0.82rem", color: "#bfe6e3" }}>Knows your household readiness</span></div>
              </div>
              <p style={{ fontSize: "0.88rem", color: "#eafffb", margin: "0 0 0.2rem" }}>
                From Phase 8, answers here will cite NEMO/CDEMA sources. Nothing below is live yet.
              </p>
              <ul className="ir-topics" aria-label="Assistant topics arriving in Phase 8">
                <li>What should I do?</li>
                <li>Prepare for hurricane</li>
                <li>Find shelter help</li>
              </ul>
              <p className="ir-disclaimer">⚠️ Full source-grounded answers arrive in Phase 8. <Link style={{ color: "#ffe9a8" }} href="/assistant">Details →</Link></p>
            </div>
          </section>
        </div>

        <div className="ir-grid">
          <section className="ir-card" aria-labelledby="hh-title">
            <h2 id="hh-title">👨‍👩‍👧 Household</h2>
            <p className="ir-sub">{household.community}, {household.country} · your role: {household.role}</p>
            <dl className="ir-kv">
              {memberRows.rows.length === 0 ? (
                <div><dt>Members</dt><dd>No members recorded yet</dd></div>
              ) : (
                memberRows.rows.map((r) => (
                  <div key={r.age_group}><dt style={{ textTransform: "capitalize" }}>{r.age_group}</dt><dd>{r.n}</dd></div>
                ))
              )}
              <div><dt>Baby / elderly / mobility / pets</dt><dd>{flags ? `${flags.baby ? "✓" : "–"} / ${flags.elderly ? "✓" : "–"} / ${flags.mobility ? "✓" : "–"} / ${flags.pets ? "✓" : "–"}` : "– / – / – / –"}</dd></div>
              <div><dt>Checklist progress</dt><dd>{done.size} of {items.length}</dd></div>
            </dl>
            <div className="ir-coming">
              <strong>Coming in Phase 5:</strong> contacts, meeting point, family roles &amp; comms plan.
              {" "}<Link href="/family">Details →</Link>
            </div>
          </section>

          <section className="ir-card" aria-labelledby="supply-title">
            <h2 id="supply-title">🧺 Supply Readiness</h2>
            <p className="ir-sub">
              Live state{memberCount === 0 ? "" : ` · ${memberCount} recorded member${memberCount === 1 ? "" : "s"}`} · Saint Lucia.
            </p>
            <table className="ir-table">
              <thead><tr><th>Supply</th><th>Ready</th><th>Status</th></tr></thead>
              <tbody>
                {supplyKeys.map((k) => {
                  const b = readinessBadge(subs[k]);
                  return (
                    <tr key={k}>
                      <td>{k === "medical" ? "⛑️ Medical" : k === "water" ? "💧 Water" : k === "food" ? "🥫 Food" : "🔦 Power"}</td>
                      <td>{subs[k]}%</td>
                      <td><span className={`ir-badge ${b.cls}`}>{b.text}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="ir-coming">
              <strong>Coming in Phase 6:</strong> quantities by household size × days with EC$ prices.
              {" "}<Link href="/supplies">Details →</Link>
            </div>
          </section>

          <section className="ir-card" aria-labelledby="rec-title">
            <h2 id="rec-title">🌤️ Recovery Readiness</h2>
            <p className="ir-sub">You&apos;re not alone. Help is available.</p>
            <ul className="ir-check">
              <li className={recoveryDone ? "done" : undefined}>
                <span aria-hidden="true">{recoveryDone ? "✓" : "○"}</span>
                <label><strong>Photograph home + key docs</strong><span>{recoveryDone ? "Filed for assistance" : "Organize for assistance / insurance"}</span></label>
              </li>
              <li className={evacDone ? "done" : undefined}>
                <span aria-hidden="true">{evacDone ? "✓" : "○"}</span>
                <label><strong>Evacuation confirmed</strong><span>{evacDone ? "Route + meeting point set" : "Route and meeting point pending"}</span></label>
              </li>
              <li>
                <span aria-hidden="true">🤝</span>
                <label><strong>Official assistance info</strong><span>NEMO + Red Cross Saint Lucia</span></label>
              </li>
            </ul>
            <div className="ir-coming">
              <strong>Coming in Phase 10:</strong> damage photos, notes, recovery tasks &amp; tracking.
              {" "}<Link href="/recovery">Details →</Link>
            </div>
          </section>
        </div>

        <div className="ir-grid">
          <EmergencyStrip />
          <section className="ir-card" aria-labelledby="trust-title">
            <h2 id="trust-title">🛡️ Safety &amp; Trust</h2>
            <p className="ir-sub" style={{ marginBottom: 0 }}>
              IslandReady AI personalizes trusted NEMO/CDEMA guidance. Every AI answer cites its
              source category and defers to official instructions. Household data stays private to
              your account; local development only. No real-time alerts, no live shelter
              availability, no claims filing in this phase.
            </p>
          </section>
          <PackCard userId={userId} householdId={household.id} />
        </div>
      </main>
    </>
  );
}
