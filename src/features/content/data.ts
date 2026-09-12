import { demoContent } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/features/session/context";

export type ContentEntry = {
  id: string;
  key: string;
  label: string;
  value: string;
  section: string;
};

export type ContentWebsite = { id: string; domain: string };

export async function getContentWebsite(session: SessionContext): Promise<ContentWebsite | null> {
  if (session.isDemo) {
    return { id: "15d755bc-dd91-4bad-942a-9d0d66cc2c31", domain: "clinicadentalmalaga.es" };
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("websites")
    .select("id, domain")
    .eq("organization_id", session.organizationId)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar la web asociada al contenido.");
  return data;
}

export async function getContentEntries(session: SessionContext): Promise<ContentEntry[]> {
  if (session.isDemo) {
    return demoContent.map((item, index) => ({
      id: `demo-${index}`,
      key: item.key,
      label: item.label,
      value: item.value,
      section: item.section,
    }));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("content_entries")
    .select("id, content_key, label, value, kind")
    .eq("organization_id", session.organizationId)
    .order("content_key");

  if (error) throw new Error("No se pudo carregar o conteúdo.");

  return (data ?? []).map((row) => ({
    id: row.id,
    key: row.content_key,
    label: row.label,
    value: typeof row.value === "string" ? row.value : JSON.stringify(row.value ?? ""),
    section: row.content_key.split(".").slice(0, -1).join(" · ") || "Geral",
  }));
}
