import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with SERVICE_ROLE_KEY.
 *
 * This client bypasses Row Level Security and must ONLY be used
 * inside server-side code (Route Handlers, Server Actions, server.ts).
 *
 * NEVER import this file from a Client Component.
 * NEVER expose the service role key in responses, logs, or browser bundles.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http")
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : "https://placeholder.supabase.co";

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || serviceRoleKey === "placeholder") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. " +
        "Set it in .env.local (local) or Vercel Environment Variables (production)."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
