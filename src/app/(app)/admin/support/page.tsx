import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { getSessionContext } from "@/features/session/context";
import { getAdminSupportTickets } from "@/features/admin/data";
import { canViewAdmin } from "@/lib/authz";
import { updateSupportTicket } from "../actions";

export default async function AdminSupportPage() {
  const session = await getSessionContext();
  if (!canViewAdmin(session.role)) notFound();
  const tickets = await getAdminSupportTickets();

  return (
    <div>
      <PageHeader
        eyebrow="Línea Sur · Operaciones"
        title="Soporte de clientes"
        description="Solicitudes abiertas de todas las organizaciones."
        action={<Link href="/admin" className="btn"><ArrowLeft size={15}/> Volver</Link>}
      />
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <ActionForm action={updateSupportTicket} className="panel p-5" key={ticket.id}>
            <input type="hidden" name="id" value={ticket.id}/>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="kicker">{ticket.organizationName}</div>
                <h2 className="mt-1 text-lg font-black">{ticket.subject}</h2>
                <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 muted">{ticket.description}</p>
              </div>
              <time className="text-xs muted">{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(ticket.createdAt))}</time>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-[180px_220px_1fr_auto] md:items-end">
              <label className="text-sm font-bold">Prioridad<select name="priority" className="input mt-1.5" defaultValue={ticket.priority}><option value="LOW">Baja</option><option value="NORMAL">Normal</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></select></label>
              <label className="text-sm font-bold">Estado<select name="status" className="input mt-1.5" defaultValue={ticket.status}><option value="OPEN">Abierto</option><option value="IN_PROGRESS">En curso</option><option value="WAITING_CUSTOMER">Esperando al cliente</option><option value="RESOLVED">Resuelto / entregado</option></select></label>
              <label className="text-sm font-bold">Respuesta<textarea name="responseNote" className="input mt-1.5 min-h-24" defaultValue={ticket.responseNote ?? ""} placeholder="Qué se ha hecho o qué necesita el cliente"/></label>
              <button className="btn btn-primary">Guardar</button>
            </div>
          </ActionForm>
        ))}
        {tickets.length === 0 && <div className="panel p-10 text-center text-sm muted">No hay solicitudes abiertas.</div>}
      </div>
    </div>
  );
}
