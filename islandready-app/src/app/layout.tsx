import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import OfflineBanner from "@/components/OfflineBanner";
import SwRegister from "@/components/SwRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IslandReady AI — Be Prepared. Stay Safe.",
  description:
    "Caribbean-first disaster preparedness. Offline essentials only; live alerts stay official.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#07333d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SwRegister />
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
