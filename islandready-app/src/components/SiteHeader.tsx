import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

import BrandMark from "./BrandMark";

const LINKS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/checklist", label: "Checklist", icon: "✅" },
  { href: "/assistant", label: "AI Assistant", icon: "🤖" },
  { href: "/family", label: "Family Plan", icon: "👨‍👩‍👧" },
  { href: "/supplies", label: "Supply Planner", icon: "🧺" },
  { href: "/recovery", label: "Recovery", icon: "🌤️" },
];

export default async function SiteHeader({ active }: { active: string }) {
  const session = await getServerSession(authOptions);
  const email = (session?.user as { email?: string } | undefined)?.email;
  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <div className="ir-alertbar" role="status">
        <div className="ir-alertbar-inner">
          <strong><span className="ir-dot" aria-hidden="true" />Hurricane season readiness — Saint Lucia</strong>
          <span>Official alerts: NEMO Saint Lucia · CDEMA — always follow official instructions.</span>
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
        <div>{email ? <span className="ir-pill">🏠 {email}</span> : null}</div>
      </header>
      <nav className="ir-nav" aria-label="Primary">
        <div className="ir-nav-card">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active === l.href ? "page" : undefined}>
              {l.icon} {l.label}
            </Link>
          ))}
        </div>
      </nav>
      <nav className="ir-mobilenav" aria-label="Mobile">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={active === l.href ? "page" : undefined}>
            {l.icon}<span>{l.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
