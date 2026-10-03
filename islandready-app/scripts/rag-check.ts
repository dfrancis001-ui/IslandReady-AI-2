// IslandReady AI — deterministic retrieval checks (Phase 7, no model required).
// Exercises src/lib/rag/retrieve.ts pure functions with fixed fixture vectors.
// Run: node scripts/rag-check.ts   (Node 24 runs .ts directly; erasable syntax only)
import { cosine, freshnessWeight, rank, type Passage } from "../src/lib/rag/retrieve.ts";

let failures = 0;
function check(name: string, cond: boolean, extra = ""): void {
  if (cond) console.log("PASS " + name);
  else {
    failures++;
    console.log("FAIL " + name + " " + extra);
  }
}

function mk(over: Partial<Passage>): Passage {
  return {
    chunkId: 1,
    docId: "d",
    registryId: "IR-DEMO-X",
    title: "t",
    publisher: "IslandReady AI (demonstration content)",
    freshnessClass: "a",
    version: 1,
    publishedDate: "2026-10-01",
    retrievedDate: "2026-10-02",
    text: "x",
    embedding: [1, 0, 0],
    ...over,
  };
}

// cosine basics
check("cosine identical", cosine([1, 0], [1, 0]) === 1);
check("cosine orthogonal", cosine([1, 0], [0, 1]) === 0);
check("cosine zero-vector", cosine([0, 0], [1, 1]) === 0);

// ranking prefers closer vectors (far one is below threshold: correctly refused)
const near = mk({ chunkId: 1, embedding: [0.9, 0.1, 0] });
const far = mk({ chunkId: 2, embedding: [0.1, 0.9, 0] });
const ranked = rank([1, 0, 0], [far, near]);
check("nearest ranks first", ranked.length === 1 && ranked[0].chunkId === 1);

// class (c) categorically excluded even with a perfect match
const evil = mk({ chunkId: 3, embedding: [1, 0, 0], freshnessClass: "c" });
check("class-c excluded despite score 1.0", rank([1, 0, 0], [evil]).length === 0);
check("freshnessWeight c is -Inf", freshnessWeight(evil) === Number.NEGATIVE_INFINITY);

// threshold gate: weak matches refuse (fail closed)
check("below-threshold refuses", rank([1, 0, 0], [mk({ embedding: [0, 1, 0] })], 3, 0.3).length === 0);

// topK respected, deterministic order
const many = [1, 2, 3, 4, 5].map((i) => mk({ chunkId: i, embedding: [1, 0, 0] }));
check("topK + stable order", JSON.stringify(rank([1, 0, 0], many, 3).map((p) => p.chunkId)) === "[1,2,3]");

// class (b) passes gate but keeps weight < 1 (date-citation duty stays with caller)
const dated = mk({ chunkId: 9, embedding: [1, 0, 0], freshnessClass: "b" });
const rb = rank([1, 0, 0], [dated]);
check("class-b retrievable at 0.9", rb.length === 1 && rb[0].score === 0.9);

if (failures > 0) {
  console.log(`${failures} FAILED`);
  process.exit(1);
}
console.log("ALL DETERMINISTIC CHECKS PASSED");
