// IslandReady AI — server-only Postgres pool (Phase 1).
// Reads DATABASE_URL from the process environment (local .env, never committed).
// Lazily created so Next.js build-time page collection never requires a database.
// No connection string is ever logged or returned to clients.
import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set (local .env only, never commit it).");
  }
  if (!pool) pool = new Pool({ connectionString });
  return pool;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function query(text: string, params?: any[]) {
  return getPool().query(text, params);
}
