"use client";
import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [community, setCommunity] = useState("Castries");
  const [msg, setMsg] = useState("");
  return (
    <main style={{ maxWidth: 420, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>IslandReady AI — Create account</h1>
      <p>Local development only. Creates your user, household, and owner membership.</p>
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
        <label>Email<br /><input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label><br /><br />
        <label>Password (8+ chars)<br /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></label><br /><br />
        <label>Community<br /><input value={community} onChange={(e) => setCommunity(e.target.value)} /></label><br /><br />
        <button type="submit">Create account</button>
      </form>
      <p role="status">{msg}</p>
    </main>
  );
}
