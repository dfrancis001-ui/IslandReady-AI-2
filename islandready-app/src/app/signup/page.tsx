"use client";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [community, setCommunity] = useState("Castries");
  const [msg, setMsg] = useState("");
  return (
    <main className="ir-main" id="main" style={{ maxWidth: 480 }}>
      <div className="ir-brand" style={{ marginBottom: "1rem" }}>
        <div className="ir-logo" aria-hidden="true">◓</div>
        <div>
          <h1>IslandReady <span>AI</span></h1>
          <p className="ir-tagline">Be Prepared. Stay Safe. Build a Stronger Tomorrow.</p>
        </div>
      </div>
      <section className="ir-card ir-form" aria-labelledby="signup-title">
        <h2 id="signup-title">Create account</h2>
        <p className="ir-sub">Local development only. Creates your user, household, and owner membership.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setMsg("Creating account…");
            const r = await fetch("/api/auth/signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password, community }),
            });
            const j = await r.json();
            if (j.ok) setMsg(r.status === 201 ? "Created — now sign in." : "Request received — try signing in.");
            else setMsg(j.error ?? "Unable to create account.");
          }}
        >
          <label htmlFor="su-email">Email</label>
          <input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <label htmlFor="su-pass">Password (8+ characters)</label>
          <input id="su-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <label htmlFor="su-comm">Community</label>
          <input id="su-comm" type="text" value={community} onChange={(e) => setCommunity(e.target.value)} />
          <p><button className="ir-btn ir-btn-primary" style={{ width: "100%" }} type="submit">Create account</button></p>
        </form>
        <p role="status">{msg}</p>
        <p className="ir-hint">Already have an account? <Link href="/login">Sign in</Link>.</p>
      </section>
    </main>
  );
}
