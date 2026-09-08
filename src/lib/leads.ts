import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { generateDemoLeads } from "@/lib/demo/data";
import {
  getDemoLeadOverrides,
  getDemoLeadNotes,
  addDemoLeadNote,
  getDemoExtraLeads,
  addDemoExtraLead,
} from "@/lib/demo/store";
import { TRAFFIC_SOURCE_LABELS } from "@/lib/types";
import type { Lead, LeadNote, LeadStatus } from "@/lib/types";

export async function getLeads(businessId: string): Promise<Lead[]> {
  if (IS_DEMO_MODE) {
    const overrides = await getDemoLeadOverrides();
    const extra = await getDemoExtraLeads();
    const generated = generateDemoLeads().map((lead) =>
      overrides[lead.id] ? { ...lead, status: overrides[lead.id] as LeadStatus } : lead
    );
    return [...extra, ...generated];
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

export interface CreateLeadInput {
  name: string;
  phone: string | null;
  email: string | null;
  service: string | null;
  status: LeadStatus;
  value_estimate: number;
}

export async function createLead(businessId: string, input: CreateLeadInput): Promise<void> {
  if (IS_DEMO_MODE) {
    await addDemoExtraLead({
      id: `demo-manual-${Date.now()}`,
      business_id: businessId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      service: input.service,
      source: "manual",
      status: input.status,
      value_estimate: input.value_estimate,
      created_at: new Date().toISOString(),
      traffic_source: null,
      traffic_medium: null,
      campaign: null,
      landing_page: null,
      referrer: null,
    });
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    business_id: businessId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    service: input.service,
    source: "manual",
    status: input.status,
    value_estimate: input.value_estimate,
  });

  if (error) throw new Error(error.message);
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

export async function getLeadNotes(businessId: string, leadId: string): Promise<LeadNote[]> {
  if (IS_DEMO_MODE) {
    const all = await getDemoLeadNotes();
    return all[leadId] ?? [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_notes")
    .select("*")
    .eq("business_id", businessId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  return (data as LeadNote[]) ?? [];
}

export async function addLeadNote(businessId: string, leadId: string, note: string): Promise<void> {
  if (IS_DEMO_MODE) {
    await addDemoLeadNote({
      id: `demo-note-${Date.now()}`,
      lead_id: leadId,
      business_id: businessId,
      author_email: "demo@lineasur.app",
      note,
      created_at: new Date().toISOString(),
    });
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("lead_notes").insert({
    business_id: businessId,
    lead_id: leadId,
    author_id: user?.id ?? null,
    author_email: user?.email ?? null,
    note,
  });

  if (error) throw new Error(error.message);
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
