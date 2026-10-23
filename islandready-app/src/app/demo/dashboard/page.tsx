import Link from "next/link";

import DemoHeader from "@/components/DemoHeader";
import EmergencyStrip from "@/components/EmergencyStrip";
import NbaCard from "@/components/NbaCard";
import ScoreRing from "@/components/ScoreRing";
import { biggestGap, nextBestActions, score, subScores } from "@/lib/scoring";
import {
  DEMO_CATEGORIES,
  DEMO_DONE,
  DEMO_HOUSEHOLD,
  DEMO_ITEMS,
  DEMO_NEEDS,
} from "@/lib/demo-data";

export const metadata = { title: "IslandReady AI — Assessor Demo Dashboard" };

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

export default function DemoDashboardPage() {
  const done = new Set(DEMO_DONE);
  const s = score(DEMO_CATEGORIES, DEMO_ITEMS, done);
  const subs = subScores(DEMO_CATEGORIES, DEMO_ITEMS, done);
  const gap = biggestGap(DEMO_CATEGORIES, DEMO_ITEMS, done);
  const gapLabel = DEMO_CATEGORIES.find((c) => c.key === gap)?.label ?? gap;
  const actions = nextBestActions(DEMO_CATEGORIES, DEMO_ITEMS, done, DEMO_NEEDS);
  const supplyKeys = ["water", "food", "medical", "power"] as const;
  const recoveryDone = done.has("photo_home");
  const evacDone = done.has("evac_route") && done.has("meeting_point");

  return (
    <>
      <DemoHeader active="/demo/dashboard" />
      <main className="ir-main" id="main">
        <section className="ir-hero" aria-labelledby="demo-hero-title">
          <div className="ir-hero-grid">
            <div>
              <span className="ir-eyebrow">🌴 Assessor demo · sample household</span>
              <h2 id="demo-hero-title">
                You&apos;re {s}% ready.<br />This household is fictional.
              </h2>
              <p>
                Explore the real dashboard components with isolated sample data. No
                sign-in, no account, and no production database are used.
              </p>
              <div className="ir-hero-cta">
                <Link className="ir-btn ir-btn-primary" href="/demo/checklist">
                  Start Next Action →
                </Link>
                <Link
                  className="ir-btn"
                  style={{
                    background: "rgba(255,255,255,.14)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,.3)",
                  }}
                  href="/demo/assistant"
                >
                  Ask the sample assistant
                </Link>
              </div>
              <p style={{ margin: "0.7rem 0 0", fontSize: "0.85rem", color: "#bfe6e3" }}>
                {DEMO_HOUSEHOLD.community} ·{" "}
                <strong style={{ color: "#fff" }}>
                  {done.size} of {DEMO_ITEMS.length} complete
                </strong>{" "}
                · all data is sample only
              </p>
            </div>
            <div className="ir-risk" aria-label="Sample weather and risk status">
              <h3>📡 Weather &amp; Risk — {DEMO_HOUSEHOLD.community}</h3>
              <div className="ir-risk-row"><span>🌀 Hurricane season prep</span><span className="ir-badge ir-badge-watch">SEASON</span></div>
              <div className="ir-risk-row"><span>🌊 Flood / landslide readiness</span><span className="ir-badge ir-badge-info">{subs["home_prep"]}%</span></div>
              <div className="ir-risk-row"><span>🔋 Power outage readiness</span><span className="ir-badge ir-badge-info">{subs["power"]}%</span></div>
              <div className="ir-risk-row"><span>🏠 Your completion</span><span className="ir-badge ir-badge-good">{done.size}/{DEMO_ITEMS.length} DONE</span></div>
              <p className="ir-hint">
                Static demo context, not a live alert. Always follow official NEMO /
                CDEMA / Met Services alerts.
              </p>
            </div>
          </div>
        </section>

        <div className="ir-grid">
          <section className="ir-card" aria-labelledby="demo-score-title">
            <h2 id="demo-score-title">Readiness Score</h2>
            <p className="ir-sub">
              Food, water, medical, comms, documents, power, home, evacuation &amp; recovery.
            </p>
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
            <div className="ir-minibars" aria-label="Sample per-category readiness">
              {DEMO_CATEGORIES.map((c) => (
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
                : `Top priority: “${actions[0].title}”. ${actions[0].reason}`}{" "}
              <Link href="/demo/checklist">Open checklist →</Link>
            </p>
          </section>

          <NbaCard actions={actions} checklistHref="/demo/checklist" demo />

          <section className="ir-card" aria-labelledby="demo-ai-title">
            <h2 id="demo-ai-title">🤖 AI Emergency Assistant</h2>
            <p className="ir-sub">
              Sample answers only. This deployment does not run a live AI model.
            </p>
            <div className="ir-ai">
              <div className="ir-ai-head">
                <div className="ir-ai-avatar" aria-hidden="true">🌺</div>
                <div><strong>IslandHelper</strong><br /><span style={{ fontSize: "0.82rem", color: "#bfe6e3" }}>Sample mode · no live AI</span></div>
              </div>
              <p style={{ fontSize: "0.88rem", color: "#eafffb", margin: "0 0 0.2rem" }}>
                Ask about hurricanes, water, supplies or shelters to see fixed
                demonstration answers.
              </p>
              <ul className="ir-topics" aria-label="Sample assistant topics">
                <li>What should I do?</li>
                <li>Prepare for hurricane</li>
                <li>Find shelter help</li>
              </ul>
              <p className="ir-disclaimer">
                ⚠️ Demonstration answers only. <Link style={{ color: "#ffe9a8" }} href="/demo/assistant">Open the sample chat →</Link>
              </p>
            </div>
          </section>
        </div>

        <div className="ir-grid">
          <section className="ir-card" aria-labelledby="demo-hh-title">
            <h2 id="demo-hh-title">👨‍👩‍👧 Sample household</h2>
            <p className="ir-sub">
              {DEMO_HOUSEHOLD.community}, {DEMO_HOUSEHOLD.country} ·{" "}
              {DEMO_HOUSEHOLD.members}
            </p>
            <dl className="ir-kv">
              <div><dt>Members</dt><dd>{DEMO_HOUSEHOLD.members}</dd></div>
              <div><dt>Sample needs flag</dt><dd>Baby</dd></div>
              <div><dt>Checklist progress</dt><dd>{done.size} of {DEMO_ITEMS.length}</dd></div>
            </dl>
            <div className="ir-coming">
              <strong>Demo:</strong> the family plan is fully editable; changes last for
              this session only. <Link href="/demo/family">Open family plan →</Link>
            </div>
          </section>

          <section className="ir-card" aria-labelledby="demo-supply-title">
            <h2 id="demo-supply-title">🧺 Supply Readiness</h2>
            <p className="ir-sub">Sample status from the demo checklist · Saint Lucia.</p>
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
              <strong>Demo:</strong> the planner calculates quantities and EC$ totals from
              a sample catalog. <Link href="/demo/supplies">Open supply planner →</Link>
            </div>
          </section>

          <section className="ir-card" aria-labelledby="demo-rec-title">
            <h2 id="demo-rec-title">🌤️ Recovery Readiness</h2>
            <p className="ir-sub">Sample records and tasks, private only to this demo.</p>
            <ul className="ir-check">
              <li className={recoveryDone ? "done" : undefined}>
                <span aria-hidden="true">{recoveryDone ? "✓" : "○"}</span>
                <label><strong>Photograph home + key docs</strong><span>{recoveryDone ? "Sample record filed" : "Open the demo recovery hub"}</span></label>
              </li>
              <li className={evacDone ? "done" : undefined}>
                <span aria-hidden="true">{evacDone ? "✓" : "○"}</span>
                <label><strong>Evacuation confirmed</strong><span>{evacDone ? "Sample route + meeting point set" : "Sample meeting point still pending"}</span></label>
              </li>
              <li>
                <span aria-hidden="true">🤝</span>
                <label><strong>Official assistance info</strong><span>NEMO + Red Cross Saint Lucia</span></label>
              </li>
            </ul>
            <div className="ir-coming">
              <strong>Demo:</strong> add records and tasks in the recovery hub; nothing is
              persisted. <Link href="/demo/recovery">Open recovery hub →</Link>
            </div>
          </section>
        </div>

        <div className="ir-grid">
          <EmergencyStrip />
          <section className="ir-card" aria-labelledby="demo-trust-title">
            <h2 id="demo-trust-title">🛡️ Safety &amp; Trust</h2>
            <p className="ir-sub" style={{ marginBottom: 0 }}>
              Every item on this page is fictional sample data. The demo does not sign
              you in, does not read a real household, and does not write to the
              production database. Real accounts, organisations and private routes
              remain protected behind authentication.
            </p>
          </section>
          <section className="ir-card" aria-labelledby="demo-map-title">
            <h2 id="demo-map-title">🧭 Explore the demo</h2>
            <ul>
              <li><Link href="/demo/checklist">✅ Interactive checklist</Link></li>
              <li><Link href="/demo/family">👨‍👩‍👧 Family plan form</Link></li>
              <li><Link href="/demo/supplies">🧺 Supply planner (EC$)</Link></li>
              <li><Link href="/demo/recovery">🌤️ Recovery records &amp; tasks</Link></li>
              <li><Link href="/demo/assistant">🤖 Sample assistant</Link></li>
              <li><Link href="/demo">🌴 Overview and guidance</Link></li>
            </ul>
            <p className="ir-hint">
              Looking for the real app? <Link href="/login">Sign in</Link> with your own
              account.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
