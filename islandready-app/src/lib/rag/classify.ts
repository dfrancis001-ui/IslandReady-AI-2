// IslandReady AI — question classifier (Phase 8).
// Pure keyword gate, deliberately independent of any LLM: classification must
// never depend on the model being honest. C = current operational/immediate
// status (always refuse/redirect without consulting static sources for status).
export type QuestionClass = "A" | "B" | "C";

const C_TERMS = [
  "warning", "warnings", "warned", "watch", "alert", "alerts",
  "evacuat", "order", "ordered", "open now", "open tonight", "open today",
  "open right now", "currently open", "right now", "rightnow", "tonight",
  "today", "active", "happening", "issued", "announced", "declared",
  "declaration", "emergency",
];
const C_SHELTER_NEEDS_STATUS = ["shelter", "shelters"];
const STATUS_VERBS = [" is ", " are ", "open", "closed", "available"];
const STATUS_NOUNS = ["availability", "status", "update"];

const B_TERMS = ["plan say", "policy", "policies", "version", "strategy", "guideline", "what does"];

export function classifyQuestion(q: string): QuestionClass {
  const t = ` ${q.toLowerCase()} `;
  const hasShelter = C_SHELTER_NEEDS_STATUS.some((w) => t.includes(w));
  const hasStatusVerb = STATUS_VERBS.some((w) => t.includes(w));
  const hasStatusNoun = STATUS_NOUNS.some((w) => t.includes(w));
  if (hasShelter && (hasStatusVerb || hasStatusNoun)) return "C";
  if (C_TERMS.some((w) => t.includes(w))) return "C";
  if (B_TERMS.some((w) => t.includes(w))) return "B";
  return "A";
}
