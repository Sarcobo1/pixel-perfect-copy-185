import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb, type Project } from "@/lib/db.server";
import { getRequestUser } from "@/lib/session.server";

export const getProjects = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await getRequestUser();
    if (!user) return { projects: [] };
    const sql = getDb();
    const rows = await sql<Project[]>`
      SELECT * FROM projects
      WHERE owner_id = ${user.id}
      ORDER BY created_at DESC
    `;
    return { projects: rows };
  },
);

export const getProjectById = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const user = await getRequestUser();
    if (!user) return { project: null };
    const sql = getDb();
    const rows = await sql<Project[]>`
      SELECT * FROM projects
      WHERE id = ${data.id} AND owner_id = ${user.id}
      LIMIT 1
    `;
    return { project: rows[0] ?? null };
  });

export const createProject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().optional().default("Untitled project"),
      prompt: z.string().optional(),
      html_code: z.string().optional(),
      brand_identity: z.record(z.unknown()).optional(),
      status: z.enum(["draft", "processing", "done", "failed"]).optional().default("draft"),
      duration_ms: z.number().optional().default(0),
    }),
  )
  .handler(async ({ data }) => {
    const user = await getRequestUser();
    if (!user) throw new Error("Not authenticated");
    const sql = getDb();
    const rows = await sql<Project[]>`
      INSERT INTO projects (owner_id, name, prompt, html_code, brand_identity, status, duration_ms)
      VALUES (
        ${user.id},
        ${data.name},
        ${data.prompt ?? null},
        ${data.html_code ?? null},
        ${data.brand_identity ? JSON.stringify(data.brand_identity) : null},
        ${data.status},
        ${data.duration_ms}
      )
      RETURNING *
    `;
    return { project: rows[0] };
  });

export const updateProject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      prompt: z.string().optional(),
      html_code: z.string().optional(),
      brand_identity: z.record(z.unknown()).optional(),
      status: z.enum(["draft", "processing", "done", "failed"]).optional(),
      duration_ms: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await getRequestUser();
    if (!user) throw new Error("Not authenticated");
    const sql = getDb();
    const { id, ...fields } = data;

    const rows = await sql<Project[]>`
      UPDATE projects SET
        name = COALESCE(${fields.name ?? null}, name),
        prompt = COALESCE(${fields.prompt ?? null}, prompt),
        html_code = COALESCE(${fields.html_code ?? null}, html_code),
        brand_identity = COALESCE(${fields.brand_identity ? JSON.stringify(fields.brand_identity) : null}::jsonb, brand_identity),
        status = COALESCE(${fields.status ?? null}, status),
        duration_ms = COALESCE(${fields.duration_ms ?? null}, duration_ms),
        updated_at = now()
      WHERE id = ${id} AND owner_id = ${user.id}
      RETURNING *
    `;
    return { project: rows[0] ?? null };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const user = await getRequestUser();
    if (!user) throw new Error("Not authenticated");
    const sql = getDb();
    await sql`DELETE FROM projects WHERE id = ${data.id} AND owner_id = ${user.id}`;
    return { success: true };
  });
