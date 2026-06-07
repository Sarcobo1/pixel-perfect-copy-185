// Stub — Supabase has been replaced by Replit PostgreSQL + Replit Auth.
export const supabaseAdmin = new Proxy({} as any, {
  get(_target, prop) {
    console.warn(`[supabaseAdmin stub] Attempted to access supabaseAdmin.${String(prop)} — Supabase removed.`);
    return () => Promise.resolve({ data: null, error: new Error("Supabase removed") });
  },
});
