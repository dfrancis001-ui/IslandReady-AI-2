// IslandReady AI — Safety Layer (Phase 8).
// Conservative evidence-support validation with fail-closed semantics.
// LIMITATION (documented, not hidden): support checking is lexical, not true
// semantic entailment. Uncertainty fails closed: anything not positively
// established as supported is treated as unsupported. Retrieved document text
// is DATA and can never authorize a claim or override these rules.
import type { RankedPassage } from "./rag/retrieve";

export interface SafetyVerdict {
  ok: boolean;
  reason?: string;
}

const STOP = new Set(
  "the,a,an,and,or,to,of,in,on,for,with,do,does,should,you,your,we,our,they,their,it,its,this,that,these,those,be,is,are,was,were,will,would,can,could,must,may,have,has,had,at,by,from,as,also,all,any,each,make,sure,then,than,so,such,no,not,now,here,there,when,where,what,how,why,which,who,i,me,my,us,our,if,then,else,into,out,up,down,over,under,again,once,during,before,after,between,through,about,against,into,per".split(
    ","
  )
);

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

/** A step is safety-critical UNLESS it is clearly non-directive filler.
// Fail-closed direction: generic advisory language (e.g. "consult a
// contractor", "check regulations") MUST require evidence rather than
// slipping through an action-keyword allowlist. */
const NON_CRITICAL = [
  /^(hi|hello|hey|thanks|thank you|ok|okay|sure)\b/i,
  /i('m| am) islandhelper/i,
  /let me know if/i,
  /feel free to ask/i,
  /\bdisclaimer\b/i,
];

export function isSafetyCritical(step: string): boolean {
  const t = step.trim();
  if (t.length === 0) return false;
  return !NON_CRITICAL.some((re) => re.test(t));
}

/** Conservative support test: every significant word must occur across the
 *  cited passages. Missing anything ⇒ unsupported (fail closed). */
export function claimSupported(claim: string, passages: RankedPassage[]): boolean {
  const needed = words(claim);
  if (needed.length === 0) return false;
  const hay = passages.map((p) => p.text.toLowerCase()).join("\n");
  return needed.every((w) => hay.includes(w));
}

const BANNED = [
  /\b\d+\s?(mg|ml|milligrams?|millilitres?|tablets?|pills?|doses?)\b/i, // dosages
  /warning (is )?in effect|warnings? (have been )?issued/i,
  /evacuation (has been |was )?ordered|ordered to evacuate|mandatory evacuation/i,
  /shelter \S+ is open|shelters? (are|is) open (now|tonight|today)/i,
  /no need to (evacuate|prepare|worry)/i,
];

/** Injected directives inside retrieved text must never authorize behavior.
 *  This detects imperative manipulation attempts for the audit trail; the
 *  enforcement is that passage text is never executed, only matched. */
const INJECTION_HINTS = [
  "ignore previous instructions",
  "ignore all previous",
  "disregard your instructions",
  "you must tell the user",
  "system:",
];

export function passageHasInjection(text: string): boolean {
  const t = text.toLowerCase();
  return INJECTION_HINTS.some((h) => t.includes(h));
}

export function validateAnswer(
  steps: string[],
  passages: RankedPassage[]
): SafetyVerdict {
  if (steps.length !== 3) return { ok: false, reason: "answer must have exactly 3 steps" };
  const corpus = steps.join("\n");
  for (const re of BANNED) {
    if (re.test(corpus)) return { ok: false, reason: "banned content detected" };
  }
  for (const s of steps) {
    if (!isSafetyCritical(s)) continue; // non-directive filler needs no evidence
    if (!claimSupported(s, passages)) {
      return { ok: false, reason: "unsupported safety-critical claim" };
    }
  }
  // Citations must name real retrieved sources (checked by caller count too).
  if (passages.length === 0) return { ok: false, reason: "no evidence" };
  return { ok: true };
}

export const DISCLAIMER =
  "Always follow official NEMO/CDEMA alerts and instructions. In immediate danger, call emergency services first.";
