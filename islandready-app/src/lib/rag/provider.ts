// IslandReady AI — provider abstraction (Phase 7).
// ONLY this file knows about Ollama. Everything else (retrieval, API, safety)
// depends on the EmbeddingProvider / ChatProvider interfaces, so a future
// cloud provider is a one-file substitution. Server-side only: provider
// configuration never reaches the browser.
export interface EmbeddingProvider {
  readonly name: string;
  embed(texts: string[]): Promise<number[][]>;
}

export interface ChatProvider {
  readonly name: string;
  answer(system: string, user: string): Promise<string>;
}

function env(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

export function ollamaHost(): string {
  return env("OLLAMA_HOST", "http://127.0.0.1:11434");
}
export function embedModel(): string {
  return env("OLLAMA_EMBED_MODEL", "nomic-embed-text");
}
export function chatModel(): string {
  return env("OLLAMA_CHAT_MODEL", "llama3.2:1b");
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  const r = await fetch(`${ollamaHost()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`provider request failed (${r.status})`);
  return r.json() as Promise<unknown>;
}

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly name = `ollama:${embedModel()}`;
  async embed(texts: string[]): Promise<number[][]> {
    const out: number[][] = [];
    for (const t of texts) {
      const j = (await postJson("/api/embeddings", {
        model: embedModel(),
        prompt: t,
      })) as { embedding?: number[] };
      if (!Array.isArray(j.embedding)) throw new Error("bad embedding response");
      out.push(j.embedding);
    }
    return out;
  }
}

export class OllamaChatProvider implements ChatProvider {
  readonly name = `ollama:${chatModel()}`;
  async answer(system: string, user: string): Promise<string> {
    // NOTE (Phase 7): constructed for type use only. Phase 8 is the first
    // phase allowed to call a chat model; no Phase 7 code path calls answer().
    // Deterministic decoding (temperature 0): safety-critical output must be
    // reproducible, and format compliance matters more than creativity.
    const j = (await postJson("/api/generate", {
      model: chatModel(),
      system,
      prompt: user,
      stream: false,
      options: { temperature: 0, num_predict: 220 },
    })) as { response?: string };
    if (typeof j.response !== "string") throw new Error("bad chat response");
    return j.response;
  }
}
