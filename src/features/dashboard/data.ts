import { demoMetrics, demoPages } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Metric } from "@/lib/types";
import type { SessionContext } from "@/features/session/context";

export type DashboardData = {
  metrics: Metric[];
  actionCounts: { whatsapp: number; phone: number; forms: number };
  pages: { path: string; title: string; views: number; actions: number; status: string }[];
};

export async function getDashboardData(session: SessionContext): Promise<DashboardData> {
  if (session.isDemo) {
    return {
      metrics: demoMetrics,
      actionCounts: { whatsapp: 42, phone: 21, forms: 13 },
      pages: demoPages,
    };
  }

  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: events, error: eventsError }, { data: leads, error: leadsError }, { data: pages, error: pagesError }] =
    await Promise.all([
      supabase
        .from("analytics_events")
        .select("event_type, page_path")
        .eq("organization_id", session.organizationId)
        .gte("occurred_at", since),
      supabase
        .from("leads")
        .select("id")
        .eq("organization_id", session.organizationId)
        .gte("created_at", since),
      supabase
        .from("pages")
        .select("path, title")
        .eq("organization_id", session.organizationId)
        .limit(50),
    ]);

  if (eventsError || leadsError || pagesError) throw new Error("No se pudo carregar o dashboard.");

  const allEvents = (events ?? []) as { event_type: string; page_path: string | null }[];
  const pageViews = allEvents.filter((event) => event.event_type === "page_view" || event.event_type === "service_page_view");
  const actionEvents = allEvents.filter((event) =>
    ["whatsapp_click", "phone_click", "form_submit", "booking_complete", "email_click"].includes(event.event_type)
  );

  const visitors = pageViews.length;
  const actions = actionEvents.length;
  const conversion = visitors > 0 ? (actions / visitors) * 100 : 0;

  const metrics: Metric[] = [
    { label: "Visitas", value: String(visitors), delta: "—", hint: "páginas vistas en los últimos 30 días" },
    { label: "Acciones de contacto", value: String(actions), delta: "—", hint: "WhatsApp, llamadas, formularios y reservas" },
    { label: "Acciones por visita", value: `${conversion.toFixed(1)}%`, delta: "—", hint: "acciones por cada 100 páginas vistas" },
    { label: "Contactos", value: String((leads ?? []).length), delta: "—", hint: "contactos recibidos en los últimos 30 días" },
  ];

  const pageStats = new Map<string, { views: number; actions: number }>();
  for (const event of allEvents) {
    const path = event.page_path ?? "/";
    const current = pageStats.get(path) ?? { views: 0, actions: 0 };
    if (event.event_type === "page_view" || event.event_type === "service_page_view") current.views += 1;
    if (["whatsapp_click", "phone_click", "form_submit", "booking_complete", "email_click"].includes(event.event_type)) current.actions += 1;
    pageStats.set(path, current);
  }

  return {
    metrics,
    actionCounts: {
      whatsapp: allEvents.filter((event) => event.event_type === "whatsapp_click").length,
      phone: allEvents.filter((event) => event.event_type === "phone_click").length,
      forms: allEvents.filter((event) => event.event_type === "form_submit").length,
    },
    pages: ((pages ?? []) as { path: string; title: string }[])
      .map((page) => ({
        ...page,
        status: "Publicada",
        ...(pageStats.get(page.path) ?? { views: 0, actions: 0 }),
      }))
      .sort((a, b) => b.actions - a.actions),
  };
}
