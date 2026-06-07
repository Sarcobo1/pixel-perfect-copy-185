import { defineEventHandler, readBody } from "h3";
import { getDb, initDb } from "@/lib/db.server";
import type { Project } from "@/lib/db.server";

const GUEST_ID = "guest";

export default defineEventHandler(async (event) => {
  const method = event.node.req.method ?? "GET";
  await initDb();
  const sql = getDb();
  const url = event.node.req.url ?? "";

  const idMatch = url.match(/\/api\/projects\/([^/?]+)/);
  const projectId = idMatch ? idMatch[1] : null;

  if (method === "GET" && !projectId) {
    const rows = await sql<Project[]>`
      SELECT * FROM projects WHERE owner_id = ${GUEST_ID}
      ORDER BY created_at DESC
    `;
    return { projects: rows };
  }

  if (method === "GET" && projectId) {
    const rows = await sql<Project[]>`
      SELECT * FROM projects WHERE id = ${projectId} AND owner_id = ${GUEST_ID} LIMIT 1
    `;
    return { project: rows[0] ?? null };
  }

  if (method === "POST" && !projectId) {
    const body = await readBody<Partial<Project>>(event);
    const rows = await sql<Project[]>`
      INSERT INTO projects (owner_id, name, prompt, html_code, brand_identity, status, duration_ms)
      VALUES (
        ${GUEST_ID},
        ${body.name ?? "Untitled project"},
        ${body.prompt ?? null},
        ${body.html_code ?? null},
        ${body.brand_identity ? JSON.stringify(body.brand_identity) : null},
        ${body.status ?? "draft"},
        ${body.duration_ms ?? 0}
      )
      RETURNING *
    `;
    return { project: rows[0] };
  }

  if ((method === "PUT" || method === "PATCH") && projectId) {
    const body = await readBody<Partial<Project>>(event);
    const rows = await sql<Project[]>`
      UPDATE projects SET
        name = COALESCE(${body.name ?? null}, name),
        prompt = COALESCE(${body.prompt ?? null}, prompt),
        html_code = COALESCE(${body.html_code ?? null}, html_code),
        brand_identity = COALESCE(${body.brand_identity ? JSON.stringify(body.brand_identity) : null}::jsonb, brand_identity),
        status = COALESCE(${body.status ?? null}, status),
        duration_ms = COALESCE(${body.duration_ms ?? null}, duration_ms),
        updated_at = now()
      WHERE id = ${projectId} AND owner_id = ${GUEST_ID}
      RETURNING *
    `;
    return { project: rows[0] ?? null };
  }

  if (method === "DELETE" && projectId) {
    await sql`DELETE FROM projects WHERE id = ${projectId} AND owner_id = ${GUEST_ID}`;
    return { success: true };
  }

  event.node.res.statusCode = 405;
  return { error: "Method not allowed" };
});
