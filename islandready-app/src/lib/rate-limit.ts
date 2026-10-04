// IslandReady AI — in-memory sliding-window rate limiter (Phase 12).
// Local-development scope: single-process store. A multi-instance production
// deployment would need a shared store (e.g. Redis) — documented, not built.
// Failures are honest 429 JSON with no account information leaked.
interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

function prune(b: Bucket, now: number, windowMs: number): void {
  while (b.hits.length > 0 && b.hits[0] <= now - windowMs) b.hits.shift();
  if (b.hits.length > 2000) b.hits.splice(0, b.hits.length - 2000);
}

/** Returns true when the call is ALLOWED (and records it), false when throttled. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    b = { hits: [] };
    buckets.set(key, b);
  }
  prune(b, now, windowMs);
  if (b.hits.length >= limit) return false;
  b.hits.push(now);
  return true;
}

/** For tests only: reset all buckets. Never exposed via HTTP. */
export function __resetRateLimits(): void {
  buckets.clear();
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : "";
  return ip || "local";
}

export function rateLimitedResponse(): Response {
  return Response.json(
    { error: "Too many requests. Please wait a minute and try again." },
    { status: 429 }
  );
}
