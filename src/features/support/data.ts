import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/features/session/context";

export type SupportTicket = {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  responseNote: string | null;
  respondedAt: string | null;
  updatedAt: string;
};

const demoTickets: SupportTicket[] = [
  { id: "demo-ticket-1", subject: "Actualizar horario del viernes", description: "Cambiar el horario de cierre a las 18:00.", priority: "NORMAL", status: "RESOLVED", responseNote: "Horario actualizado y publicado en la web.", respondedAt: "2026-09-08T10:00:00Z", updatedAt: "2026-09-08T10:00:00Z" },
  { id: "demo-ticket-2", subject: "Nueva foto del equipo", description: "Sustituir la foto actual de la página Nosotros.", priority: "NORMAL", status: "IN_PROGRESS", responseNote: null, respondedAt: null, updatedAt: "2026-09-09T09:30:00Z" },
];

export async function getSupportTickets(session: SessionContext): Promise<SupportTicket[]> {
  if (session.isDemo) return demoTickets;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, subject, description, priority, status, response_note, responded_at, updated_at")
    .eq("organization_id", session.organizationId)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("No se pudo carregar o suporte.");
  return (data ?? []).map((row) => ({
    id: row.id,
    subject: row.subject,
    description: row.description,
    priority: row.priority,
    status: row.status,
    responseNote: row.response_note,
    respondedAt: row.responded_at,
    updatedAt: row.updated_at,
  }));
}
