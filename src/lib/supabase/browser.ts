"use client";

import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseBrowserConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase não configurado.");
  return { url, key };
}

export function createSupabaseBrowserClient() {
  const { url, key } = getSupabaseBrowserConfig();
  return createBrowserClient(url, key);
}
