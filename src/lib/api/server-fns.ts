import { createServerFn } from "@tanstack/react-start";
import { getDb, initDb } from "@/lib/db.server";
import type { Project, Profile } from "@/lib/db.server";
import { z } from "zod";

const GUEST_ID = "guest";

// ── PROFILE ──────────────────────────────────────────────────────────────────

export const getProfile = createServerFn({ method: "GET" }).handler(async () => {
  await initDb();
  const sql = getDb();
  const rows = await sql<Profile[]>`SELECT * FROM profiles WHERE id = ${GUEST_ID} LIMIT 1`;
  return { profile: rows[0] ?? null };
});

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator(z.object({ display_name: z.string().optional() }))
  .handler(async ({ data }) => {
    await initDb();
    const sql = getDb();
    const rows = await sql<Profile[]>`
      INSERT INTO profiles (id, display_name)
      VALUES (${GUEST_ID}, ${data.display_name ?? null})
      ON CONFLICT (id) DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
        updated_at = now()
      RETURNING *
    `;
    return { profile: rows[0] ?? null };
  });

// ── PROJECTS ─────────────────────────────────────────────────────────────────

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  await initDb();
  const sql = getDb();
  const rows = await sql<Project[]>`
    SELECT * FROM projects WHERE owner_id = ${GUEST_ID}
    ORDER BY updated_at DESC
  `;
  return { projects: rows };
});

export const getProject = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const sql = getDb();
    const rows = await sql<Project[]>`
      SELECT * FROM projects WHERE id = ${data.id} AND owner_id = ${GUEST_ID} LIMIT 1
    `;
    return { project: rows[0] ?? null };
  });

const CreateProjectInput = z.object({
  name: z.string().optional(),
  prompt: z.string().optional(),
  html_code: z.string().optional(),
  brand_identity: z.record(z.unknown()).optional(),
  status: z.enum(["draft", "processing", "done", "failed"]).optional(),
  duration_ms: z.number().optional(),
});

export const createProject = createServerFn({ method: "POST" })
  .inputValidator(CreateProjectInput)
  .handler(async ({ data }) => {
    await initDb();
    const sql = getDb();
    const rows = await sql<Project[]>`
      INSERT INTO projects (owner_id, name, prompt, html_code, brand_identity, status, duration_ms)
      VALUES (
        ${GUEST_ID},
        ${data.name ?? "Untitled project"},
        ${data.prompt ?? null},
        ${data.html_code ?? null},
        ${data.brand_identity ? JSON.stringify(data.brand_identity) : null},
        ${data.status ?? "draft"},
        ${data.duration_ms ?? 0}
      )
      RETURNING *
    `;
    return { project: rows[0] };
  });

const UpdateProjectInput = z.object({
  id: z.string(),
  name: z.string().optional(),
  prompt: z.string().optional(),
  html_code: z.string().optional(),
  brand_identity: z.record(z.unknown()).optional(),
  status: z.enum(["draft", "processing", "done", "failed"]).optional(),
  duration_ms: z.number().optional(),
});

export const updateProject = createServerFn({ method: "POST" })
  .inputValidator(UpdateProjectInput)
  .handler(async ({ data }) => {
    await initDb();
    const sql = getDb();
    const rows = await sql<Project[]>`
      UPDATE projects SET
        name        = COALESCE(${data.name ?? null}, name),
        prompt      = COALESCE(${data.prompt ?? null}, prompt),
        html_code   = COALESCE(${data.html_code ?? null}, html_code),
        brand_identity = COALESCE(
          ${data.brand_identity ? JSON.stringify(data.brand_identity) : null}::jsonb,
          brand_identity
        ),
        status      = COALESCE(${data.status ?? null}, status),
        duration_ms = COALESCE(${data.duration_ms ?? null}, duration_ms),
        updated_at  = now()
      WHERE id = ${data.id} AND owner_id = ${GUEST_ID}
      RETURNING *
    `;
    return { project: rows[0] ?? null };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const sql = getDb();
    await sql`DELETE FROM projects WHERE id = ${data.id} AND owner_id = ${GUEST_ID}`;
    return { success: true };
  });

// ── VIDEO EXPORT QUOTA ───────────────────────────────────────────────────────

async function ensureGuestProfile(sql: ReturnType<typeof getDb>) {
  await sql`
    INSERT INTO profiles (id, plan, videos_used, videos_limit, reset_at)
    VALUES (${GUEST_ID}, 'free', 0, 3, date_trunc('month', now()) + interval '1 month')
    ON CONFLICT (id) DO NOTHING
  `;
}

export const checkVideoExportQuota = createServerFn({ method: "GET" }).handler(async () => {
  await initDb();
  const sql = getDb();
  await ensureGuestProfile(sql);

  const rows = await sql<Profile[]>`
    UPDATE profiles SET
      videos_used = CASE WHEN reset_at <= now() THEN 0 ELSE videos_used END,
      reset_at = CASE WHEN reset_at <= now() THEN date_trunc('month', now()) + interval '1 month' ELSE reset_at END,
      updated_at = now()
    WHERE id = ${GUEST_ID}
    RETURNING *
  `;

  const profile = rows[0];
  const isPremium = profile?.plan === "pro" || profile?.plan === "api";
  const allowed = isPremium || (profile?.videos_used ?? 0) < (profile?.videos_limit ?? 3);

  return {
    allowed,
    isPremium,
    videosUsed: profile?.videos_used ?? 0,
    videosLimit: profile?.videos_limit ?? 3,
    resetAt: profile?.reset_at ?? null,
  };
});

export const recordVideoExport = createServerFn({ method: "POST" }).handler(async () => {
  await initDb();
  const sql = getDb();
  await ensureGuestProfile(sql);

  const rows = await sql<Profile[]>`
    UPDATE profiles SET
      videos_used = CASE
        WHEN plan IN ('pro', 'api') THEN videos_used
        WHEN reset_at <= now() THEN 1
        ELSE videos_used + 1
      END,
      reset_at = CASE WHEN reset_at <= now() THEN date_trunc('month', now()) + interval '1 month' ELSE reset_at END,
      updated_at = now()
    WHERE id = ${GUEST_ID}
    RETURNING *
  `;

  return { profile: rows[0] ?? null };
});
