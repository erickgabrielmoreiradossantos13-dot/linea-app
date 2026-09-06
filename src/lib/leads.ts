import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { generateDemoLeads } from "@/lib/demo/data";
import { getDemoLeadOverrides } from "@/lib/demo/store";
import { TRAFFIC_SOURCE_LABELS } from "@/lib/types";
import type { Lead, LeadStatus } from "@/lib/types";

export async function getLeads(businessId: string): Promise<Lead[]> {
  if (IS_DEMO_MODE) {
    const overrides = await getDemoLeadOverrides();
    return generateDemoLeads().map((lead) =>
      overrides[lead.id] ? { ...lead, status: overrides[lead.id] as LeadStatus } : lead
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(500);

  return (data as Lead[]) ?? [];
}

export async function getLeadById(businessId: string, leadId: string): Promise<Lead | null> {
  if (IS_DEMO_MODE) {
    const leads = await getLeads(businessId);
    return leads.find((l) => l.id === leadId) ?? null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", leadId)
    .maybeSingle();

  return (data as Lead) ?? null;
}

export interface AttributionBreakdown {
  label: string;
  count: number;
  share: number;
}

/**
 * Atribución básica (Prioridad 7): a partir de los leads ya cargados,
 * responde "¿de dónde llegan mis contactos?" y "¿qué página genera más
 * contactos?". Sin fabricar datos: si un lead no tiene traffic_source o
 * landing_page (leads antiguos, o cuenta real sin atribución configurada
 * todavía), se agrupa honestamente en "Sin datos de origen".
 */
export function getLeadAttribution(leads: Lead[]): {
  bySource: AttributionBreakdown[];
  byLandingPage: AttributionBreakdown[];
} {
  const total = leads.length;
  const sourceCounts = new Map<string, number>();
  const pageCounts = new Map<string, number>();

  for (const lead of leads) {
    const sourceLabel = lead.traffic_source ? TRAFFIC_SOURCE_LABELS[lead.traffic_source] : "Sin datos de origen";
    sourceCounts.set(sourceLabel, (sourceCounts.get(sourceLabel) ?? 0) + 1);

    const pageLabel = lead.landing_page ?? "Sin datos de página";
    pageCounts.set(pageLabel, (pageCounts.get(pageLabel) ?? 0) + 1);
  }

  const toBreakdown = (counts: Map<string, number>): AttributionBreakdown[] =>
    Array.from(counts.entries())
      .map(([label, count]) => ({ label, count, share: total > 0 ? count / total : 0 }))
      .sort((a, b) => b.count - a.count);

  return { bySource: toBreakdown(sourceCounts), byLandingPage: toBreakdown(pageCounts) };
}
