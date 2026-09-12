import Link from "next/link";
import { Columns3, List, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getContactos } from "@/features/leads/data";
import { StatusBadge } from "@/components/status-badge";
import { getSessionContext } from "@/features/session/context";
import { requireFeature } from "@/lib/features";
import { can } from "@/lib/authz";
import type { LeadStatus } from "@/lib/types";
import { KanbanBoard } from "@/components/dashboard/kanban-board";

export default async function ContactosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; view?: string }>;
}) {
  const session = await getSessionContext();
  requireFeature(session, "leads");
  const params = await searchParams;
  const allowedStatuses: LeadStatus[] = ["NEW","CONTACTED","QUALIFIED","MEETING","PROPOSAL","WON","LOST"];
  const status = allowedStatuses.includes(params.status as LeadStatus) ? params.status as LeadStatus : undefined;
  const q = params.q?.trim().slice(0, 100);
  const view = params.view === "kanban" ? "kanban" : "list";
  const leads = await getContactos(session, { q, status });
  return (
    <div>
      <PageHeader
        eyebrow="Gestión comercial"
        title="Contactos"
        description="Organiza tus oportunidades y da seguimiento a cada conversación."
        action={can(session.role, "ADMIN") ? <Link href="/leads/new" className="btn btn-primary inline-flex items-center gap-2"><Plus size={15}/> Nuevo lead</Link> : null}
      />
      {session.isDemo && <div className="mb-4 text-xs font-semibold text-neutral-500">Datos de ejemplo · los cambios no se guardan.</div>}
      <div className="mb-4 flex justify-end gap-2">
        <Link href={`/leads?view=list${status ? `&status=${status}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`btn ${view === "list" ? "btn-primary" : ""}`} aria-label="Vista de lista"><List size={16}/> Lista</Link>
        <Link href={`/leads?view=kanban${status ? `&status=${status}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`btn ${view === "kanban" ? "btn-primary" : ""}`} aria-label="Vista Kanban"><Columns3 size={16}/> Kanban</Link>
      </div>
      <div className="panel">
        <form method="get" className="flex flex-col gap-3 border-b border-neutral-200 p-4 sm:flex-row">
          <label className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-neutral-400"/>
            <input name="q" defaultValue={q} className="input pl-9" placeholder="Buscar nombre, email o teléfono" aria-label="Buscar contactos"/>
          </label>
          <select name="status" defaultValue={status ?? ""} className="input sm:max-w-48" aria-label="Filtrar estado">
            <option value="">Todos los estados</option>
            <option value="NEW">Nuevo</option>
            <option value="CONTACTED">Contactado</option>
            <option value="QUALIFIED">Cualificado</option>
            <option value="MEETING">Reunión</option>
            <option value="PROPOSAL">Propuesta</option>
            <option value="WON">Ganado</option>
            <option value="LOST">Perdido</option>
          </select>
          <input type="hidden" name="view" value={view}/>
          <button className="btn">Filtrar</button>
        </form>
        {view === "kanban" ? <div className="p-4"><KanbanBoard initialLeads={leads}/></div> :
        <div className="table-wrap">
          <table>
            <thead><tr><th>Contacto</th><th>Origen</th><th>Página</th><th>Status</th><th>Recibido</th></tr></thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td><Link className="font-bold hover:underline" href={`/leads/${lead.id}`}>{lead.name}</Link><div className="mt-1 text-xs text-neutral-500">{lead.email || lead.phone || "Sin datos de contacto"}</div></td>
                  <td>{lead.source}</td>
                  <td className="text-neutral-500">{lead.page}</td>
                  <td><StatusBadge status={lead.status}/></td>
                  <td className="text-neutral-500">{new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"short"}).format(new Date(lead.createdAt))}</td>
                </tr>
              ))}
            {leads.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-neutral-500">No hay contactos que coincidan con la búsqueda.</td></tr>}
            </tbody>
          </table>
        </div>}
      </div>
    </div>
  );
}
