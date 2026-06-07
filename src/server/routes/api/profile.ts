import { defineEventHandler, readBody } from "h3";
import { getDb, initDb } from "@/lib/db.server";
import type { Profile } from "@/lib/db.server";

const GUEST_ID = "guest";

export default defineEventHandler(async (event) => {
  const method = event.node.req.method ?? "GET";
  await initDb();
  const sql = getDb();

  if (method === "GET") {
    const rows = await sql<Profile[]>`SELECT * FROM profiles WHERE id = ${GUEST_ID} LIMIT 1`;
    return { profile: rows[0] ?? null };
  }

  if (method === "POST" || method === "PUT") {
    const body = await readBody<{ display_name?: string }>(event);
    const rows = await sql<Profile[]>`
      INSERT INTO profiles (id, display_name)
      VALUES (${GUEST_ID}, ${body.display_name ?? null})
      ON CONFLICT (id) DO UPDATE SET
        display_name = COALESCE(${body.display_name ?? null}, profiles.display_name),
        updated_at = now()
      RETURNING *
    `;
    return { profile: rows[0] };
  }

  event.node.res.statusCode = 405;
  return { error: "Method not allowed" };
});
