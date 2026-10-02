// IslandReady AI brand mark (dashboard/header icon).
// Concept: shield (preparedness) + check (readiness) + sun + island waves
// (Caribbean identity), in the navy/teal/yellow product palette.
// Pure SVG, no assets, crisp at header size. Decorative: parent labels it.
export default function BrandMark({ size = 52 }: { size?: number }) {
  const gid = "ir-logo-g";
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" role="img" aria-label="IslandReady AI logo">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a4d5a" />
          <stop offset="1" stopColor="#0ea5a0" />
        </linearGradient>
      </defs>
      <rect width="52" height="52" rx="14" fill={`url(#${gid})`} />
      <circle cx="37" cy="13" r="5.5" fill="#ffc53d" />
      <path
        d="M25 9l9.5 3.8v7.4c0 6.6-4.2 10.9-9.5 13.3-5.3-2.4-9.5-6.7-9.5-13.3v-7.4z"
        fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinejoin="round"
      />
      <path
        d="M20.5 22.5l3.6 3.6 6.4-7.2"
        fill="none" stroke="#ffc53d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M9 42q4.5-3.6 9 0t9 0 9 0"
        fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.9"
      />
      <path
        d="M13 46.5q4-3 8 0t8 0 8 0"
        fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.55"
      />
    </svg>
  );
}
