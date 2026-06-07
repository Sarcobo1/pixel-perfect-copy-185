import { json, defineEventHandler, createError, readBody } from 'h3';
import { db, initDb } from '@/lib/db.server';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { owner_id, name } = body;

  if (!owner_id || !name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' });
  }

  try {
    await initDb();
    const result = await db.query(
      `INSERT INTO projects (owner_id, name, status, duration_ms)
       VALUES ($1, $2, 'draft', 0) RETURNING *`,
      [owner_id, name],
    );
    return json({ success: true, project: result.rows[0] });
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: String(err) });
  }
});
