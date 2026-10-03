// IslandReady AI — retrieval core (Phase 7).
// Pure, dependency-injectable functions: cosine ranking, freshness weighting,
// evidence-eligibility filtering, and the no-evidence threshold gate.
// Class (c) passages are categorically EXCLUDED from the evidence set —
// relevance/freshness scores can never promote them (approved correction).
// Embeddings arrive as plain number arrays from any EmbeddingProvider.
export interface Passage {
  chunkId: number;
  docId: string;
  registryId: string;
  title: string;
  publisher: string;
  freshnessClass: "a" | "b" | "c";
  version: number;
  publishedDate: string | null;
  retrievedDate: string;
  text: string;
  embedding: number[];
}

export interface RankedPassage extends Passage {
  score: number;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Freshness multiplier. Class (c) returns -Infinity: never evidence. */
export function freshnessWeight(p: Passage): number {
  if (p.freshnessClass === "c") return Number.NEGATIVE_INFINITY;
  if (p.freshnessClass === "b") return 0.9;
  return 1.0;
}

/**
 * Rank eligible passages for a query embedding. Returns at most `topK
 * passages with weighted score >= threshold. Empty array = no evidence:
 * the caller MUST take the refusal path (fail closed).
 *
 * Threshold note: calibrated on the demo corpus, where genuinely relevant
 * top passages score ~0.63+ and irrelevant queries top out ~0.55.
 * Recalibrate if the corpus changes materially.
 */
export function rank(
  queryEmbedding: number[],
  passages: Passage[],
  topK = 3,
  threshold = 0.6
): RankedPassage[] {
  return passages
    .map((p) => {
      const w = freshnessWeight(p);
      return { ...p, score: w === Number.NEGATIVE_INFINITY ? w : cosine(queryEmbedding, p.embedding) * w };
    })
    .filter((p) => p.score >= threshold)
    .sort((x, y) => y.score - x.score || (x.chunkId < y.chunkId ? -1 : 1))
    .slice(0, topK);
}
