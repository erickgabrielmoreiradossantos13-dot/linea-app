import { demoPages } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/features/session/context";

export type WebsiteSummary = {
  id: string;
  name: string;
  domain: string;
  status: string;
  publishedAt: string | null;
  pages: { id: string; path: string; title: string; metaDescription: string | null; isIndexable: boolean; status: string; views: number; actions: number }[];
};

export async function getWebsiteSummary(session: SessionContext): Promise<WebsiteSummary | null> {
  if (session.isDemo) {
    return {
      id: "15d755bc-dd91-4bad-942a-9d0d66cc2c31",
      name: "Website principal",
      domain: "clinicadentalmalaga.es",
      status: "ACTIVE",
      publishedAt: new Date().toISOString(),
      pages: demoPages.map((page, index) => ({ id: `demo-page-${index}`, metaDescription: "Descripción de demostración", isIndexable: true, ...page })),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: website, error } = await supabase
    .from("websites")
    .select("id, name, domain, status, published_at")
    .eq("organization_id", session.organizationId)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("No se pudo carregar o website.");
  if (!website) return null;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: pages, error: pagesError }, { data: events, error: eventsError }] = await Promise.all([
    supabase
      .from("pages")
      .select("id, path, title, meta_description, is_indexable")
      .eq("organization_id", session.organizationId)
      .eq("website_id", website.id)
      .order("path"),
    supabase
      .from("analytics_events")
      .select("event_type, page_path")
      .eq("organization_id", session.organizationId)
      .eq("website_id", website.id)
      .gte("occurred_at", since),
  ]);

  if (pagesError || eventsError) throw new Error("No se pudo carregar as páginas.");

  const stats = new Map<string, { views: number; actions: number }>();
  for (const event of events ?? []) {
    const path = event.page_path ?? "/";
    const current = stats.get(path) ?? { views: 0, actions: 0 };
    if (event.event_type === "page_view" || event.event_type === "service_page_view") current.views += 1;
    if (["whatsapp_click","phone_click","form_submit","booking_complete","email_click"].includes(event.event_type)) current.actions += 1;
    stats.set(path, current);
  }

  return {
    id: website.id,
    name: website.name,
    domain: website.domain,
    status: website.status,
    publishedAt: website.published_at,
    pages: (pages ?? []).map((page) => ({
      id: page.id,
      path: page.path,
      title: page.title,
      metaDescription: page.meta_description,
      isIndexable: page.is_indexable,
      status: page.is_indexable ? "Indexable" : "No indexable",
      ...(stats.get(page.path) ?? { views: 0, actions: 0 }),
    })),
  };
}
