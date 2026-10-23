import Link from "next/link";

import BrandMark from "./BrandMark";

// Auth-free header for the public assessor demo. Deliberately does not import
// SiteHeader or next-auth: demo pages must work with no NEXTAUTH_SECRET and no
// DATABASE_URL. Later additions must keep this component free of session/DB
// imports.

const LINKS = [
  { href: "/demo/dashboard", label: "Home", icon: "🏠" },
  { href: "/demo/checklist", label: "Checklist", icon: "✅" },
  { href: "/demo/assistant", label: "AI Assistant", icon: "🤖" },
  { href: "/demo/family", label: "Family Plan", icon: "👨‍👩‍👧" },
  { href: "/demo/supplies", label: "Supply Planner", icon: "🧺" },
  { href: "/demo/recovery", label: "Recovery", icon: "🌤️" },
  { href: "/demo", label: "Overview", icon: "🌴" },
];

export default function DemoHeader({ active }: { active: string }) {
  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <div className="ir-alertbar" role="status">
        <div className="ir-alertbar-inner">
          <strong><span className="ir-dot" aria-hidden="true" />Assessor demo — sample data only</strong>
          <span>No real account, household or organisation data is shown. Demo changes are temporary.</span>
        </div>
      </div>
      <header className="ir-header">
        <div className="ir-brand">
          <div style={{ flex: "0 0 52px" }}>
            <BrandMark size={52} />
          </div>
          <div>
            <h1>IslandReady <span>AI</span></h1>
            <p className="ir-tagline">Be Prepared. Stay Safe. Build a Stronger Tomorrow.</p>
          </div>
        </div>
        <div><Link className="ir-pill" href="/">Exit demo</Link></div>
      </header>
      <nav className="ir-nav" aria-label="Demo primary">
        <div className="ir-nav-card">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active === l.href ? "page" : undefined}>
              {l.icon} {l.label}
            </Link>
          ))}
        </div>
      </nav>
      <nav className="ir-mobilenav" aria-label="Demo mobile">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={active === l.href ? "page" : undefined}>
            {l.icon}<span>{l.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
