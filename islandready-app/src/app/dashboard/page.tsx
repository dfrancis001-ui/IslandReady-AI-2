import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { myHouseholds } from "@/lib/households";
import { biggestGap, nextBestActions, score, type CategoryRow, type ItemRow } from "@/lib/scoring";
import EmergencyStrip from "@/components/EmergencyStrip";
import NbaCard from "@/components/NbaCard";
import ScoreRing from "@/components/ScoreRing";
import SiteHeader from "@/components/SiteHeader";
import SignOutButton from "./signout-button";

export const dynamic = "force-dynamic";

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
  const gap = biggestGap(cats, items, done);
  const gapLabel = cats.find((c) => c.key === gap)?.label ?? gap;
  const actions = nextBestActions(cats, items, done, new Set<string>());

  return (
    <>
      <SiteHeader active="/dashboard" />
      <main className="ir-main" id="main">
        <section className="ir-hero" aria-labelledby="hero-title">
          <h2 id="hero-title">
            You&apos;re {s}% ready.<br />Let&apos;s close the last gap — together.
          </h2>
          <p>
            Every Caribbean household can answer: <strong>WHO</strong> do I contact?{" "}
            <strong>WHERE</strong> do we go? <strong>WHAT</strong> do we do next?
          </p>
          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <Link className="ir-btn ir-btn-primary" href="/checklist">Start Next Action →</Link>
            <Link className="ir-btn" style={{ background: "rgba(255,255,255,.14)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }} href="/assistant">AI Assistant</Link>
          </div>
          <p style={{ margin: "0.7rem 0 0", fontSize: "0.85rem" }}>
            Hurricane &amp; flood plan · <strong>{done.size} of {items.length} complete</strong> · {household.community}
            {" · "}<SignOutButton />
          </p>
        </section>

        <div className="ir-grid">
          <section className="ir-card" aria-labelledby="score-title">
            <h2 id="score-title">Readiness Score</h2>
            <p className="ir-sub">Across food, water, medical, comms, documents, power, home, evacuation &amp; recovery.</p>
            <div className="ir-score-wrap">
              <ScoreRing score={s} />
              <div className="ir-score-text">
                <strong>{s}%</strong>
                <p className="ir-sub" style={{ margin: "0.2rem 0" }}>
                  Biggest gap: <strong style={{ color: "#0a4d5a" }}>{gapLabel}</strong>.
                </p>
              </div>
            </div>
            <div className="ir-progress" aria-hidden="true"><span style={{ width: `${s}%` }} /></div>
            <p className="ir-gap">
              💬 <strong>Insight:</strong> {actions.length === 0
                ? "Full checklist complete. Run a family drill to stay sharp."
                : `Start with “${actions[0].title}” to close your ${gapLabel.toLowerCase()} gap.`}
            </p>
          </section>

          <NbaCard actions={actions} />

          <section className="ir-card" aria-labelledby="risk-title">
            <h2 id="risk-title">📡 Seasonal readiness context — {household.community}</h2>
            <p className="ir-sub">
              Static preparedness context, not a live alert. Always check official
              NEMO Saint Lucia / CDEMA / Met Services alerts before acting.
            </p>
            <div className="ir-progress" aria-hidden="true"><span style={{ width: `${(100 * done.size) / items.length}%` }} /></div>
            <p className="ir-gap">
              Hurricane &amp; flood plan · <strong>{done.size} of {items.length} complete</strong>
              <br /><Link href="/checklist">Continue the checklist →</Link>
            </p>
          </section>
        </div>

        <div className="ir-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <EmergencyStrip />
          <section className="ir-card" aria-labelledby="more-title">
            <h2 id="more-title">More sections</h2>
            <p className="ir-sub">Live in this phase: dashboard + checklist. The rest arrive in their phases.</p>
            <ul>
              <li><Link href="/assistant">AI Assistant</Link> — Phase 8</li>
              <li><Link href="/family">Family Plan</Link> — Phase 5</li>
              <li><Link href="/supplies">Supply Planner</Link> — Phase 6</li>
              <li><Link href="/recovery">Recovery Hub</Link> — Phase 10</li>
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
