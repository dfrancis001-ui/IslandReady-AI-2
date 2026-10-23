import Link from "next/link";

// Public landing: static, needs no DATABASE_URL or NEXTAUTH_SECRET.
// Previously this was redirect("/dashboard") which turned a missing
// auth secret on serverless into a 500 on "/". Dashboard stays protected
// by middleware; start here works even before env is configured.
export default function Home() {
  return (
    <main className="ir-main" id="main" style={{ maxWidth: 640 }}>
      <h1>IslandReady AI</h1>
      <p className="ir-tagline">Be Prepared. Stay Safe. Build a Stronger Tomorrow.</p>
      <p>
        <Link href="/login">Sign in</Link> · <Link href="/signup">Create account</Link> ·{" "}
        <Link href="/dashboard">Dashboard</Link>
      </p>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/demo" className="ir-btn ir-btn-primary">
          Explore Assessor Demo
        </Link>
      </p>
      <p className="ir-hint">
        No account needed — sample data only. Demo changes are temporary and never
        touch real household data.
      </p>
    </main>
  );
}
