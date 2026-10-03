"use client";
import { useOnline } from "./SwRegister";

export default function OfflineBanner(): React.ReactNode {
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" aria-live="polite"
      style={{ background: "#07333d", color: "#fff", padding: "0.6rem 1.25rem", fontSize: "0.9rem", fontWeight: 600 }}>
      📴 You&apos;re offline — showing last-synced essentials below (not current information).
      The AI assistant is unavailable offline. For live alerts, use official NEMO/CDEMA radio channels.
    </div>
  );
}
