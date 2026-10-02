import Link from "next/link";

export default function PhaseShell({
  title,
  phase,
  children,
}: {
  title: string;
  phase: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ir-shell">
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p className="ir-sub">
        Coming in {phase}. This section is a placeholder — no data shown here is
        computed, stored, or sent anywhere yet.
      </p>
      <div>{children}</div>
      <p style={{ marginBottom: 0 }}>
        <Link href="/dashboard">← Back to dashboard</Link>
      </p>
    </div>
  );
}
