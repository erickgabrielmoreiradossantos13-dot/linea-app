import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type IngestionWebsite = {
  id: string;
  organization_id: string;
  allowed_origin: string | null;
};

export async function getIngestionWebsite(siteKey: string): Promise<IngestionWebsite | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("websites")
    .select("id, organization_id, allowed_origin")
    .eq("site_key", siteKey)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error || !data) return null;
  return data as IngestionWebsite;
}

export function isAllowedOrigin(origin: string | null, allowedOrigin: string | null) {
  return Boolean(origin && allowedOrigin && origin === allowedOrigin);
}

export function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
