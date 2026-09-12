import { demoContactos } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Lead, LeadStatus } from "@/lib/types";
import type { SessionContext } from "@/features/session/context";

type LeadRow = {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  page_path: string | null;
  message: string | null;
  status: LeadStatus;
  created_at: string;
};

function mapLead(row: LeadRow): Lead {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    company: row.company ?? undefined,
    source: row.source ?? "Website",
    page: row.page_path ?? "/",
    message: row.message ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getContactos(
  session: SessionContext,
  filters?: { q?: string; status?: LeadStatus }
): Promise<Lead[]> {
  if (session.isDemo) {
    let leads = demoContactos;
    if (filters?.status) leads = leads.filter((lead) => lead.status === filters.status);
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      leads = leads.filter((lead) => [lead.name, lead.email, lead.phone].some((value) => value?.toLowerCase().includes(q)));
    }
    return leads;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, organization_id, name, email, phone, company, source, page_path, message, status, created_at")
    .eq("organization_id", session.organizationId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error("No se pudo carregar os leads.");
  let leads = ((data ?? []) as LeadRow[]).map(mapLead);
  if (filters?.status) leads = leads.filter((lead) => lead.status === filters.status);
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    leads = leads.filter((lead) => [lead.name, lead.email, lead.phone].some((value) => value?.toLowerCase().includes(q)));
  }
  return leads;
}

export async function getLeadById(session: SessionContext, id: string): Promise<Lead | null> {
  if (session.isDemo) return demoContactos.find((lead) => lead.id === id) ?? null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, organization_id, name, email, phone, company, source, page_path, message, status, created_at")
    .eq("organization_id", session.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("No se pudo carregar o lead.");
  return data ? mapLead(data as LeadRow) : null;
}

export type LeadNote = {
  id: string;
  note: string;
  createdAt: string;
};

export async function getLeadNotes(session: SessionContext, leadId: string): Promise<LeadNote[]> {
  if (session.isDemo) {
    return [{ id: "demo-note", note: "Llamar el jueves por la mañana.", createdAt: "2026-09-09T09:30:00Z" }];
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_notes")
    .select("id, note, created_at")
    .eq("organization_id", session.organizationId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("No se pudieron cargar las notas del contacto.");
  return (data ?? []).map((row) => ({ id: row.id, note: row.note, createdAt: row.created_at }));
}
