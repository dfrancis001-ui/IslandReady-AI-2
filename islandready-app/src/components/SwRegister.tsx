"use client";
import { useEffect, useState } from "react";

// Registers the static-shell service worker and exposes online/offline state.
// No household data flows through here.
export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline shell is best-effort; the app stays usable online.
      });
    }
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export default function SwRegister(): null {
  useOnline();
  return null;
}
