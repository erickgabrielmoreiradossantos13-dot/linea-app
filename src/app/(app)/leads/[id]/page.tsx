import { ActionForm } from "@/components/action-form";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getLeadById, getLeadNotes } from "@/features/leads/data";
import { getSessionContext } from "@/features/session/context";
import { updateLeadAction, updateLeadDetails } from "../server-actions";
import { requireFeature } from "@/lib/features";
import { can } from "@/lib/authz";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionContext();
  requireFeature(session, "leads");
  const lead = await getLeadById(session, id);
  if (!lead) notFound();
  const notes = await getLeadNotes(session, id);
  const editable = can(session.role, "ADMIN");

  return (
    <div>
      <PageHeader eyebrow="Oportunidad" title={lead.name} description={`${lead.source} · llegó desde ${lead.page}`} action={<StatusBadge status={lead.status}/>} />
      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <ActionForm action={updateLeadDetails} className="panel p-5">
          <input type="hidden" name="id" value={lead.id}/>
          <div className="kicker">Contacto</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold sm:col-span-2">Nombre<input name="name" className="input mt-1.5" defaultValue={lead.name} readOnly={!editable} required/></label>
            <label className="text-sm font-bold">Email<input name="email" type="email" className="input mt-1.5" defaultValue={lead.email ?? ""} readOnly={!editable}/></label>
            <label className="text-sm font-bold">Teléfono<input name="phone" className="input mt-1.5" defaultValue={lead.phone ?? ""} readOnly={!editable}/></label>
            <label className="text-sm font-bold">Empresa<input name="company" className="input mt-1.5" defaultValue={lead.company ?? ""} readOnly={!editable}/></label>
            <label className="text-sm font-bold">Origen<input name="source" className="input mt-1.5" defaultValue={lead.source} readOnly={!editable} required/></label>
            <label className="text-sm font-bold sm:col-span-2">Mensaje<textarea name="message" className="input mt-1.5 min-h-24" defaultValue={lead.message ?? ""} readOnly={!editable}/></label>
          </div>
          <p className="mt-4 text-xs muted">Recibido {new Intl.DateTimeFormat("es-ES",{dateStyle:"medium",timeStyle:"short"}).format(new Date(lead.createdAt))}</p>
          {editable && <button className="btn mt-4">Guardar datos</button>}
        </ActionForm>
        <ActionForm action={updateLeadAction} className="panel p-5">
          <input type="hidden" name="id" value={lead.id}/>
          <div className="kicker">Seguimiento</div>
          <div className="mt-5">
            <label className="text-sm font-bold">Status
              <select name="status" className="input mt-1.5" defaultValue={lead.status}>
                <option value="NEW">Nuevo</option><option value="CONTACTED">Contactado</option><option value="QUALIFIED">Cualificado</option><option value="MEETING">Reunión</option><option value="PROPOSAL">Propuesta</option><option value="WON">Ganado</option><option value="LOST">Perdido</option>
              </select>
            </label>
          </div>
          <label className="mt-4 block text-sm font-bold">Añadir nota<textarea className="input mt-1.5 min-h-28 resize-y" name="note" placeholder="Anota el contexto y el siguiente paso…"/></label>
          {editable && <button className="btn btn-primary mt-4">Guardar seguimiento</button>}
          {session.isDemo && <p className="mt-3 text-xs text-neutral-500">Los cambios no se guardan en la demostración.</p>}
        </ActionForm>
      </div>
      <section className="panel mt-5 p-5">
        <div className="kicker">Historial</div>
        <h2 className="mt-1 text-lg font-black">Notas del contacto</h2>
        <div className="mt-4">
          {notes.map((note) => <article className="history-entry" key={note.id}><p>{note.note}</p><time>{new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(note.createdAt))}</time></article>)}
          {notes.length === 0 && <p className="text-sm muted">Todavía no hay notas.</p>}
        </div>
      </section>
    </div>
  );
}
