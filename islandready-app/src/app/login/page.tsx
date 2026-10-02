"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

import BrandMark from "@/components/BrandMark";

export default function LoginPage() {
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
            if (r?.ok) window.location.href = "/dashboard";
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
    </main>
  );
}
