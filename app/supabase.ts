// Supabase client for QuoteRevive (Phase 2 cloud accounts).
// Built from the two public env vars. When they are missing (e.g. a local
// build without .env.local), `supabase` is null and the app runs in the
// original local-only mode — demo account included — exactly as before.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const cloudEnabled = supabase !== null;
