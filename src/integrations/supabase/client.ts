// Stub — Supabase has been replaced by Replit PostgreSQL + Replit Auth.
// This file exists so legacy imports don't break during incremental migration.
export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    console.warn(`[supabase stub] Attempted to access supabase.${String(prop)} — Supabase has been removed.`);
    return () => Promise.resolve({ data: null, error: new Error("Supabase removed") });
  },
});
