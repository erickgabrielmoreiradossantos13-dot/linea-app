import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { getSessionContext } from "@/features/session/context";
import { getSupportTickets, type SupportTicket } from "@/features/support/data";
import { createTicketAction } from "./actions";
import { requireFeature } from "@/lib/features";

const statusLabel: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En curso",
  WAITING_CUSTOMER: "Pendiente de tu respuesta",
  RESOLVED: "Resuelto",
};

function TicketTable({ tickets, empty }: { tickets: SupportTicket[]; empty: string }) {
  return (
    <div className="panel table-wrap">
      <table>
        <thead><tr><th>Asunto</th><th>Prioridad</th><th>Status</th><th>Respuesta</th><th>Actualización</th></tr></thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td><div className="font-bold">{ticket.subject}</div><div className="mt-1 max-w-md text-xs muted">{ticket.description}</div></td>
              <td>{ticket.priority}</td>
              <td><span className="badge">{statusLabel[ticket.status] ?? ticket.status}</span></td>
              <td className="max-w-md text-sm muted">{ticket.responseNote ?? "Pendiente de respuesta"}</td>
              <td className="muted">{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(ticket.updatedAt))}</td>
            </tr>
          ))}
          {tickets.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-neutral-500">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default async function SupportPage() {
  const session = await getSessionContext();
  requireFeature(session, "support");
  const tickets = await getSupportTickets(session);
  const active = tickets.filter((ticket) => ticket.status !== "RESOLVED");
  const delivered = tickets.filter((ticket) => ticket.status === "RESOLVED");

  return (
    <div>
      <PageHeader eyebrow="Tu equipo, cerca" title="Solicitudes" description="Pide una mejora, comunica un problema y sigue su evolución."/>
      <ActionForm action={createTicketAction} className="panel mb-5 grid gap-4 p-5 lg:grid-cols-[1fr_180px_auto] lg:items-end">
        <label className="text-sm font-bold">Asunto<input name="subject" className="input mt-1.5" required placeholder="Ej.: actualizar el horario del sábado"/></label>
        <label className="text-sm font-bold">Prioridad<select name="priority" className="input mt-1.5" defaultValue="NORMAL"><option value="LOW">Baja</option><option value="NORMAL">Normal</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></select></label>
        <button className="btn btn-primary">Crear solicitud</button>
        <label className="text-sm font-bold lg:col-span-3">Descripción<textarea name="description" className="input mt-1.5 min-h-24" required placeholder="Describe qué necesitas cambiar o corregir."/></label>
      </ActionForm>
      <section>
        <div className="section-heading"><div><div className="kicker">En curso</div><h2 className="mt-1 text-lg font-black">Solicitudes activas</h2></div><span className="badge">{active.length}</span></div>
        <TicketTable tickets={active} empty="No hay solicitudes abiertas."/>
      </section>
      <section className="mt-7">
        <div className="section-heading"><div><div className="kicker">Historial</div><h2 className="mt-1 text-lg font-black">Mejoras entregadas</h2></div><span className="badge">{delivered.length}</span></div>
        <TicketTable tickets={delivered} empty="Las solicitudes resueltas aparecerán aquí."/>
      </section>
    </div>
  );
}
