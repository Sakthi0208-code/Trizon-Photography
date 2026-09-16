import { createClient } from "@supabase/supabase-js";

function getSupabaseConfig() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Supabase project URL is missing."
    );
  }

  if (!supabaseSecretKey) {
    throw new Error(
      "Supabase secret key is missing."
    );
  }

  return {
    supabaseUrl,
    supabaseSecretKey,
  };
}

export function createAdminClient() {
  const {
    supabaseUrl,
    supabaseSecretKey,
  } = getSupabaseConfig();

  return createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}