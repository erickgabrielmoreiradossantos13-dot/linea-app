import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TicketPriority, TicketStatus } from "@/lib/types";

export type AdminSummary = {
  activeOrganizations: number;
  openTickets: number;
  integrationErrors: number;
  activeSubscriptions: number;
};

export async function getAdminSummary(): Promise<AdminSummary> {
  const supabase = await createSupabaseServerClient();
  const [organizations, tickets, integrations, subscriptions] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).neq("status", "RESOLVED"),
    supabase.from("integrations").select("id", { count: "exact", head: true }).eq("status", "ERROR"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["ACTIVE","TRIALING"]),
  ]);

  if (organizations.error || tickets.error || integrations.error || subscriptions.error) {
    throw new Error("No se pudo carregar o resumo administrativo.");
  }

  return {
    activeOrganizations: organizations.count ?? 0,
    openTickets: tickets.count ?? 0,
    integrationErrors: integrations.count ?? 0,
    activeSubscriptions: subscriptions.count ?? 0,
  };
}

export type AdminSupportTicket = {
  id: string;
  organizationId: string;
  organizationName: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  responseNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getAdminSupportTickets(): Promise<AdminSupportTicket[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, organization_id, subject, description, priority, status, response_note, created_at, updated_at, organizations(name)")
    .neq("status", "RESOLVED")
    .order("priority", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("No se pudieron cargar las solicitudes de soporte.");

  return (data ?? []).map((ticket) => ({
    id: ticket.id,
    organizationId: ticket.organization_id,
    organizationName: (ticket.organizations as unknown as { name: string } | null)?.name ?? "Organización",
    subject: ticket.subject,
    description: ticket.description,
    priority: ticket.priority as TicketPriority,
    status: ticket.status as TicketStatus,
    responseNote: ticket.response_note,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  }));
}
