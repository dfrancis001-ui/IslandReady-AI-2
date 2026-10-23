import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import DemoChecklist from "@/components/DemoChecklist";

// Public assessor demo. Deliberately static: no session lookup, no database
// query and no API calls, so it works even when authentication or the database
// are unavailable. All content below is sample/demonstration material.

export const metadata = { title: "IslandReady AI — Assessor Demo" };

const NAV = [
  { href: "#guidance", label: "Emergency guidance" },
  { href: "#checklist", label: "Checklist" },
  { href: "#supplies", label: "Emergency supplies" },
  { href: "#family", label: "Family plan" },
  { href: "#assistant", label: "AI assistant" },
  { href: "#recovery", label: "Recovery" },
  { href: "#weather", label: "Weather" },
];

const SUPPLIES: { item: string; qty: string }[] = [
  { item: "Drinking water", qty: "4 L per person per day (3–7 days)" },
  { item: "Non-perishable food", qty: "3–7 days per person" },
  { item: "Manual can opener", qty: "1" },
  { item: "First-aid kit", qty: "1" },
  { item: "Prescription medicines", qty: "7-day supply" },
  { item: "Torch and spare batteries", qty: "1–2" },
  { item: "Battery or hand-crank radio", qty: "1" },
  { item: "Power bank", qty: "1–2" },
  { item: "Whistle", qty: "1 per person" },
  { item: "Important documents (waterproof)", qty: "1 set" },
  { item: "Cash in small notes", qty: "As practical" },
  { item: "Hygiene items", qty: "3–7 days" },
];

export default function DemoPage() {
  return (
    <main className="ir-main" id="main">
      <div id="top" />

      <header className="ir-brand" style={{ marginBottom: "1rem" }}>
        <div style={{ flex: "0 0 52px" }}>
          <BrandMark size={52} />
        </div>
        <div>
          <h1>
            IslandReady <span>AI</span>
          </h1>
          <p className="ir-tagline">
            Be Prepared. Stay Safe. Build a Stronger Tomorrow.
          </p>
        </div>
      </header>

      <section className="ir-card" aria-labelledby="demo-title">
        <span className="ir-badge ir-badge-info">Assessor demo</span>
        <h2 id="demo-title" style={{ marginTop: "0.5rem" }}>
          IslandReady AI — Assessor Demo
        </h2>
        <p className="ir-sub">
          Explore the main preparedness features with sample information. This page
          is public and read-only: it does not sign you in, does not read any
          account or household data, and does not connect to the production
          database.
        </p>
        <p className="ir-hint">
          Demonstration content only. It is not live emergency advice, a real
          forecast or an official alert. In a real emergency, follow NEMO Saint
          Lucia, CDEMA and local emergency services.
        </p>

        <nav aria-label="Demo sections">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginTop: "0.8rem",
            }}
          >
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                style={{
                  border: "1px solid var(--line)",
                  background: "#fff",
                  color: "var(--ocean-800)",
                  borderRadius: 999,
                  padding: "0.4rem 0.7rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                {n.label}
              </a>
            ))}
          </div>
        </nav>
      </section>

      <section
        className="ir-card"
        style={{ marginTop: "1rem", border: "2px solid var(--teal)" }}
        aria-labelledby="interactive-demo-title"
      >
        <span className="ir-badge ir-badge-good">Interactive</span>
        <h2 id="interactive-demo-title" style={{ marginTop: "0.5rem" }}>
          Try the working demo
        </h2>
        <p className="ir-sub">
          Open the real IslandReady components with isolated sample data. You can
          tick checklist items, edit a family plan, calculate an EC$ supply kit,
          add recovery tasks and try fixed assistant answers. Nothing is saved
          and no account is used.
        </p>
        <p style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
          <Link className="ir-btn ir-btn-primary" href="/demo/dashboard">
            Open demo dashboard →
          </Link>
          <Link className="ir-btn ir-btn-secondary" href="/demo/checklist">
            Checklist
          </Link>
          <Link className="ir-btn ir-btn-secondary" href="/demo/family">
            Family plan
          </Link>
          <Link className="ir-btn ir-btn-secondary" href="/demo/supplies">
            Supply planner
          </Link>
          <Link className="ir-btn ir-btn-secondary" href="/demo/recovery">
            Recovery
          </Link>
          <Link className="ir-btn ir-btn-secondary" href="/demo/assistant">
            Sample assistant
          </Link>
        </p>
        <p className="ir-hint">
          Demo changes are temporary and local to your browser. Real accounts and
          organisation data stay behind sign-in.
        </p>
      </section>

      <section
        className="ir-card"
        id="guidance"
        aria-labelledby="guidance-title"
        style={{ marginTop: "1rem" }}
      >
        <h2 id="guidance-title">🚨 Emergency guidance</h2>
        <p className="ir-sub">
          Sample first actions for common Caribbean hazards. Always follow the
          instructions of local authorities.
        </p>
        <div className="ir-grid">
          <article>
            <h3>🌀 Hurricane</h3>
            <ul>
              <li>Know your nearest shelter and your safest route.</li>
              <li>Secure loose outdoor items and shut storm shutters.</li>
              <li>Charge phones and store water, food and medicines.</li>
              <li>Evacuate early if authorities tell you to.</li>
              <li>Stay indoors until the all-clear is given.</li>
            </ul>
          </article>
          <article>
            <h3>🌊 Flood</h3>
            <ul>
              <li>Move to higher ground before roads close.</li>
              <li>Never walk or drive through flood water.</li>
              <li>Keep away from drains, rivers and the coast.</li>
              <li>Carry documents, medicines and a torch.</li>
              <li>Follow official evacuation instructions.</li>
            </ul>
          </article>
          <article>
            <h3>🏚️ Earthquake</h3>
            <ul>
              <li>Drop, Cover and Hold On.</li>
              <li>Stay away from windows and heavy furniture.</li>
              <li>After the shaking, check for injuries and damage.</li>
              <li>Expect aftershocks and avoid damaged buildings.</li>
              <li>Follow official guidance before returning home.</li>
            </ul>
          </article>
        </div>
      </section>

      <section
        className="ir-card"
        id="checklist"
        aria-labelledby="checklist-title"
        style={{ marginTop: "1rem" }}
      >
        <h2 id="checklist-title">✅ Preparedness checklist</h2>
        <p className="ir-sub">
          Tick the sample tasks to see how the checklist works. This demo keeps
          everything in your browser.
        </p>
        <DemoChecklist />
      </section>

      <section
        className="ir-card"
        id="supplies"
        aria-labelledby="supplies-title"
        style={{ marginTop: "1rem" }}
      >
        <h2 id="supplies-title">🧺 Emergency supplies</h2>
        <p className="ir-sub">
          Example emergency-kit quantities for a household. Adjust to your family
          size, needs and storage.
        </p>
        <table className="ir-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Example quantity</th>
            </tr>
          </thead>
          <tbody>
            {SUPPLIES.map((s) => (
              <tr key={s.item}>
                <td>{s.item}</td>
                <td>{s.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ir-hint">
          Sample list only. In the full app, saved supply lists snapshot their
          prices and stay private to your household.
        </p>
      </section>

      <section
        className="ir-card"
        id="family"
        aria-labelledby="family-title"
        style={{ marginTop: "1rem" }}
      >
        <h2 id="family-title">👨‍👩‍👧 Family preparedness — fictional example</h2>
        <p className="ir-sub">
          The people and numbers below are invented for this demo and do not
          describe a real family.
        </p>
        <div className="ir-kv">
          <div>
            <dt>Sample household</dt>
            <dd>2 adults, 2 children (example)</dd>
          </div>
          <div>
            <dt>Meeting place near home</dt>
            <dd>The large tree at the end of the street (example)</dd>
          </div>
          <div>
            <dt>Meeting place outside the area</dt>
            <dd>The community centre on the main road (example)</dd>
          </div>
          <div>
            <dt>Lead contact</dt>
            <dd>Alex Example (parent) — 758-000-0001 (example)</dd>
          </div>
          <div>
            <dt>Out-of-area contact</dt>
            <dd>Sam Example (relative) — 758-000-0002 (example)</dd>
          </div>
          <div>
            <dt>Check-in plan</dt>
            <dd>Text rather than call; agree a daily check-in time.</dd>
          </div>
        </div>
        <p className="ir-hint">
          In the full app, your family plan is saved to your own household record
          and is visible only to you.
        </p>
      </section>

      <section
        className="ir-card"
        id="assistant"
        aria-labelledby="assistant-title"
        style={{ marginTop: "1rem" }}
      >
        <h2 id="assistant-title">🤖 AI assistant — example conversation</h2>
        <div className="ir-ai">
          <p className="ir-disclaimer">
            <strong>Example only.</strong> This deployment does not run a live AI
            service, so the answers below are fixed demonstration text.
          </p>
          <p className="ir-bubble-me">
            What should I pack if a hurricane is coming?
          </p>
          <p className="ir-bubble-ai">
            Start with water (4 litres per person per day), non-perishable food, a
            manual can opener, medicines, a first-aid kit, a torch, a battery
            radio, a power bank and important documents in a waterproof bag.
            Charge your phone, secure outdoor items and follow NEMO Saint Lucia
            for official instructions.
          </p>
          <p className="ir-bubble-me">Where can I find shelter information?</p>
          <p className="ir-bubble-ai">
            Use official NEMO Saint Lucia and CDEMA channels, or your local
            disaster office, for shelter openings and evacuation routes. This demo
            does not list live shelters.
          </p>
          <p className="ir-disclaimer">
            In the full app, every assistant answer cites its approved sources and
            includes a safety disclaimer.
          </p>
        </div>
      </section>

      <section
        className="ir-card"
        id="recovery"
        aria-labelledby="recovery-title"
        style={{ marginTop: "1rem" }}
      >
        <h2 id="recovery-title">🌤️ Recovery guidance</h2>
        <p className="ir-sub">
          Sample steps for the first days after a disaster. Your safety comes
          first.
        </p>
        <ol>
          <li>
            <strong>Check for danger.</strong> Watch for gas leaks, damaged wiring,
            downed power lines and unsafe buildings.
          </li>
          <li>
            <strong>Get medical help.</strong> Treat injuries and check on
            neighbours who may need assistance.
          </li>
          <li>
            <strong>Document damage.</strong> Take photos and notes before you
            clean up, if it is safe to do so.
          </li>
          <li>
            <strong>Contact support.</strong> Reach your insurer, landlord or
            assistance agency and keep receipts.
          </li>
          <li>
            <strong>Use official channels.</strong> Follow NEMO and local
            authorities for aid, water safety and re-entry instructions. Beware of
            scams.
          </li>
          <li>
            <strong>Look after wellbeing.</strong> Rest, stay hydrated and stay in
            contact with people you trust.
          </li>
        </ol>
        <p className="ir-hint">
          In the full app, damage records and photos are private to your household
          and can be organized for assistance or insurance claims.
        </p>
      </section>

      <section
        className="ir-card"
        id="weather"
        aria-labelledby="weather-title"
        style={{ marginTop: "1rem" }}
      >
        <h2 id="weather-title">🌦️ Weather preparedness — Saint Lucia &amp; the Caribbean</h2>
        <p className="ir-sub">
          General preparedness guidance only. This demo does not show live
          weather, forecasts, warnings or official alerts.
        </p>
        <ul>
          <li>
            Hurricane season in the Caribbean runs from June to November; stay
            ready before conditions change.
          </li>
          <li>
            A <strong>watch</strong> means conditions are possible; a{" "}
            <strong>warning</strong> means they are expected. Act early.
          </li>
          <li>
            Keep a battery radio and charged phone for updates when power or
            mobile data fail.
          </li>
          <li>
            Know the difference between a shelter and a safe room, and agree where
            your household will meet.
          </li>
          <li>
            For live conditions, follow NEMO Saint Lucia, CDEMA and local radio or
            emergency services. Do not rely on this demo for current weather.
          </li>
        </ul>
      </section>

      <section className="ir-card" style={{ marginTop: "1rem" }}>
        <h2>Explore the rest of IslandReady AI</h2>
        <p className="ir-sub">
          The demo above uses sample data. The full app keeps each household&apos;s
          records private behind sign-in.
        </p>
        <p style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
          <a className="ir-btn ir-btn-secondary" href="#top">
            Back to demo top
          </a>
          <Link className="ir-btn ir-btn-primary" href="/demo/dashboard">
            Open interactive demo →
          </Link>
          <Link className="ir-btn ir-btn-secondary" href="/">
            IslandReady home
          </Link>
        </p>
      </section>
    </main>
  );
}
