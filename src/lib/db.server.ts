import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __dbReady: Promise<void> | undefined;
}

export function getDb() {
  if (!globalThis.__db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    globalThis.__db = postgres(url, { ssl: false });
  }
  return globalThis.__db;
}

export type ProjectStatus = "draft" | "processing" | "done" | "failed";

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  status: ProjectStatus;
  thumbnail_url: string | null;
  duration_ms: number;
  prompt: string | null;
  html_code: string | null;
  brand_identity: Record<string, unknown> | null;
  instagram_handle: string | null;
  telegram_handle: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: "free" | "pro" | "api";
  videos_used: number;
  videos_limit: number;
  reset_at: string;
  created_at: string;
  updated_at: string;
}

async function _runMigrations() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      display_name TEXT,
      avatar_url TEXT,
      plan TEXT NOT NULL DEFAULT 'free',
      videos_used INTEGER NOT NULL DEFAULT 0,
      videos_limit INTEGER NOT NULL DEFAULT 3,
      reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS videos_used INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS videos_limit INTEGER NOT NULL DEFAULT 3`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month'`;
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'Untitled project',
      status TEXT NOT NULL DEFAULT 'draft',
      thumbnail_url TEXT,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      prompt TEXT,
      html_code TEXT,
      brand_identity JSONB,
      instagram_handle TEXT,
      telegram_handle TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS projects_owner_idx ON projects(owner_id, updated_at DESC)`;
  console.log("[db] migrations complete");
}

export async function initDb() {
  if (!globalThis.__dbReady) {
    globalThis.__dbReady = _runMigrations();
  }
  return globalThis.__dbReady;
}
