# IslandReady AI — RAG architecture note (Phase 7)

## Source permission is an ingestion gate, not a system-development gate

NEMO/CDEMA candidates exist in `kb_sources` with `ingest_allowed = false`
(metadata only — no external text is stored). The ingest runner refuses any
registry ID that is not explicitly allowed, so pending-permission sources can
never enter the corpus by accident. When written permission (or a covering
open licence) is obtained, enabling an official source requires only a
registry status update plus ingest — no architectural change.

The initial ingestible corpus is original IslandReady-authored demonstration
content, every passage labeled "IslandReady AI demonstration content — NOT
official government guidance." Demo content is never presented as NEMO, CDEMA,
government, or medical authority.

## Storage and providers

- PostgreSQL JSONB embeddings + application-side cosine similarity. No pgvector
  dependency (documented future optimization only).
- Provider abstraction (`src/lib/rag/provider.ts`): `EmbeddingProvider` /
  `ChatProvider` interfaces; only the Ollama implementation knows about Ollama.
  Model names and host come from environment (`OLLAMA_HOST`,
  `OLLAMA_EMBED_MODEL`, `OLLAMA_CHAT_MODEL`). Server-side only.
- Chat generation is NOT called in Phase 7 (interface exists for types only).

## Safety posture (unchanged by corpus choice)

- Class (c) / current-operational material is categorically excluded from the
  evidence set — relevance scores can never promote it.
- Unknown-date sources are class (b) minimum; (b) answers require version/date
  citation; stale entries are never presented as current.
- Retrieved document text is DATA, never instructions (adversarial fixture
  IR-DEMO-INJECT-01 proves this in tests).
- Refusal is fail-closed: no eligible passages above threshold ⇒ no answer.

## Query-log privacy and retention

Logs store household_id, question, retrieved chunk IDs, decision, timestamp
only — no member details, no special-needs flags, no family-plan contents.
Retention: 30 days; purge with:
`DELETE FROM kb_query_log WHERE created_at < now() - INTERVAL '30 days';`
Household deletion cascades its logs.
