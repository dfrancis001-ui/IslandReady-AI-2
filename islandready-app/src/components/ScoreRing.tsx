// SVG score ring (same geometry as the prototype: r=52, C=326.73).
export default function ScoreRing({ score }: { score: number }) {
  const C = 326.73;
  const offset = (C * (1 - score / 100)).toFixed(2);
  return (
    <svg viewBox="0 0 120 120" width="132" height="132" role="img" aria-label={`Readiness score ${score} percent`}>
      <circle cx="60" cy="60" r="52" fill="none" stroke="#e8f0f2" strokeWidth="14" />
      <circle cx="60" cy="60" r="52" fill="none" stroke="#0ea5a0" strokeWidth="14" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={offset} transform="rotate(-90 60 60)" />
      <text x="60" y="62" textAnchor="middle" fontSize="26" fontWeight="800" fill="#07333d">{score}%</text>
      <text x="60" y="80" textAnchor="middle" fontSize="11" fill="#56707a">READY</text>
    </svg>
  );
}
