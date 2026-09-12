import type { SessionContext } from "@/features/session/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AutomatedSeoCheck = {
  key: string;
  label: string;
  detail: string;
  passed: boolean;
};

export async function getAutomatedSeoChecks(session: SessionContext): Promise<AutomatedSeoCheck[]> {
  if (session.isDemo) {
    return [
      { key: "domain", label: "Dominio conectado", detail: "clinicadentalmalaga.es", passed: true },
      { key: "pages", label: "Páginas indexables", detail: "4 páginas configuradas", passed: true },
      { key: "titles", label: "Títulos únicos", detail: "Todos los títulos son distintos", passed: true },
      { key: "descriptions", label: "Meta descripciones", detail: "Falta completar 1 página", passed: false },
    ];
  }

  const supabase = await createSupabaseServerClient();
  const { data: website, error: websiteError } = await supabase
    .from("websites")
    .select("id, domain")
    .eq("organization_id", session.organizationId)
    .eq("status", "ACTIVE")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (websiteError) throw new Error("No se pudo comprobar el dominio.");

  if (!website) {
    return [
      { key: "domain", label: "Dominio conectado", detail: "Conecta una web para iniciar el diagnóstico", passed: false },
      { key: "pages", label: "Páginas indexables", detail: "Sin web configurada", passed: false },
      { key: "titles", label: "Títulos únicos", detail: "Sin páginas que revisar", passed: false },
      { key: "descriptions", label: "Meta descripciones", detail: "Sin páginas que revisar", passed: false },
    ];
  }

  const { data: pages, error } = await supabase
    .from("pages")
    .select("title, meta_description, is_indexable")
    .eq("organization_id", session.organizationId)
    .eq("website_id", website.id);
  if (error) throw new Error("No se pudo comprobar el SEO de las páginas.");

  const indexable = (pages ?? []).filter((page) => page.is_indexable);
  const normalizedTitles = indexable.map((page) => page.title.trim().toLowerCase());
  const uniqueTitles = new Set(normalizedTitles);
  const described = indexable.filter((page) => (page.meta_description?.trim().length ?? 0) >= 70);

  return [
    { key: "domain", label: "Dominio conectado", detail: website.domain, passed: true },
    { key: "pages", label: "Páginas indexables", detail: `${indexable.length} de ${pages?.length ?? 0} páginas`, passed: indexable.length > 0 },
    { key: "titles", label: "Títulos únicos", detail: indexable.length ? `${uniqueTitles.size} de ${indexable.length} títulos únicos` : "Sin páginas indexables", passed: indexable.length > 0 && uniqueTitles.size === indexable.length },
    { key: "descriptions", label: "Meta descripciones", detail: `${described.length} de ${indexable.length} con 70 caracteres o más`, passed: indexable.length > 0 && described.length === indexable.length },
  ];
}
