import Link from "next/link";

export interface NbaAction {
  title: string;
  category: string;
  reason: string;
}

export default function NbaCard({
  actions,
  checklistHref = "/checklist",
  demo = false,
}: {
  actions: NbaAction[];
  checklistHref?: string;
  demo?: boolean;
}) {
  return (
    <section className="ir-card ir-nba" aria-labelledby="nba-title">
      <h2 id="nba-title" style={{ marginTop: "0.4rem" }}>Next Best Action</h2>
      {actions.length === 0 ? (
        <p className="ir-sub">All checklist items complete — run a family drill to stay sharp.</p>
      ) : (
        <ol>
          {actions.map((a) => (
            <li key={a.title}>
              <strong>{a.title}</strong>
              <br /><small>{a.reason}</small>
            </li>
          ))}
        </ol>
      )}
      <Link className="ir-btn ir-btn-primary" style={{ width: "100%" }} href={checklistHref}>
        Start Now — checklist
      </Link>
      <p className="ir-hint" style={{ textAlign: "center" }}>
        {demo
          ? "Sample data only — this demo does not save checklist changes."
          : "Grounded in NEMO / CDEMA guidance · computed from your live checklist state."}
      </p>
    </section>
  );
}
