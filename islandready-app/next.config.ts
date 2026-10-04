import type { NextConfig } from "next";

// Baseline security headers (Phase 12). Deliberate choices for this app:
// - No external scripts, fonts, images, or connections: everything is
//   same-origin (plus data:/blob: for images), so script-src/style-src carry
//   'unsafe-inline' ONLY for Next.js hydration/inline styles — no remote hosts.
// - frame-ancestors 'none' (+ legacy X-Frame-Options DENY): no embedding.
// - HSTS: effective on HTTPS deployments; browsers ignore it on localhost.
// - No worker-src restriction: service worker (sw.js) is same-origin.
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "connect-src 'self'",
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
