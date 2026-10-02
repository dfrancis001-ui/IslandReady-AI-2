"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <main style={{ maxWidth: 420, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>IslandReady AI — Sign in</h1>
      <p>Local development sign-in. Use the account you created on the signup page.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg("Signing in…");
          const r = await signIn("credentials", { email, password, redirect: false });
          if (r?.ok) window.location.href = "/dashboard";
          else setMsg("Invalid email or password.");
        }}
      >
        <label>Email<br /><input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label><br /><br />
        <label>Password<br /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label><br /><br />
        <button type="submit">Sign in</button>
      </form>
      <p role="status">{msg}</p>
    </main>
  );
}
