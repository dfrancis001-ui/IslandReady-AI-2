"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import BrandMark from "@/components/BrandMark";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <main className="ir-main" id="main" style={{ maxWidth: 480 }}>
      <div className="ir-brand" style={{ marginBottom: "1rem" }}>
        <div style={{ flex: "0 0 52px" }}>
          <BrandMark size={52} />
        </div>
        <div>
          <h1>IslandReady <span>AI</span></h1>
          <p className="ir-tagline">Be Prepared. Stay Safe. Build a Stronger Tomorrow.</p>
        </div>
      </div>
      <section className="ir-card ir-form" aria-labelledby="login-title">
        <h2 id="login-title">Sign in</h2>
        <p className="ir-sub">Local development sign-in. Use the account you created on the signup page.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setMsg("Signing in…");
            const r = await signIn("credentials", { email, password, redirect: false });
            if (r?.ok) router.push("/dashboard");
            else setMsg("Invalid email or password.");
          }}
        >
          <label htmlFor="li-email">Email</label>
          <input id="li-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <label htmlFor="li-pass">Password</label>
          <input id="li-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <p><button className="ir-btn ir-btn-primary" style={{ width: "100%" }} type="submit">Sign in</button></p>
        </form>
        <p role="status">{msg}</p>
        <p className="ir-hint">No account yet? <Link href="/signup">Create one</Link>.</p>
      </section>

      <section className="ir-card" style={{ marginTop: "1rem" }} aria-labelledby="login-demo-title">
        <span className="ir-badge ir-badge-info">Assessor demo</span>
        <h2 id="login-demo-title" style={{ marginTop: "0.5rem" }}>No sign-in needed for the demo</h2>
        <p className="ir-sub">
          Open the public demo to explore the main IslandReady features with
          isolated sample data. Sign-in is only for real household, private and
          organisation data.
        </p>
        <p style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
          <Link className="ir-btn ir-btn-primary" href="/demo/dashboard">
            Explore Assessor Demo →
          </Link>
          <Link className="ir-btn ir-btn-secondary" href="/demo">
            Demo overview
          </Link>
        </p>
      </section>
    </main>
  );
}
