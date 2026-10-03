"use client";
import { signOut } from "next-auth/react";
import { clearPack } from "@/lib/offline-pack";

export default function SignOutButton({ userId }: { userId: string }) {
  return (
    <button
      onClick={() => {
        clearPack(userId); // device-local pack must not survive sign-out
        signOut({ callbackUrl: "/login" });
      }}
    >
      Sign out
    </button>
  );
}
