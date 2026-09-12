import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { createLeadAction } from "../server-actions";
import { getSessionContext } from "@/features/session/context";
import { requireFeature } from "@/lib/features";

export default async function NewLeadPage() {
  const session = await getSessionContext();
  requireFeature(session, "leads");
  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="CRM" title="Nuevo lead" description="Añade un contacto recibido por teléfono, en persona o por otro canal."/>
      <ActionForm action={createLeadAction} className="panel space-y-4 p-6">
        <label className="block text-sm font-bold">Nombre<input className="input mt-1.5" name="name" required/></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold">Email<input className="input mt-1.5" name="email" type="email"/></label>
          <label className="block text-sm font-bold">Teléfono<input className="input mt-1.5" name="phone"/></label>
        </div>
        <label className="block text-sm font-bold">Origen<input className="input mt-1.5" name="source" defaultValue="Manual"/></label>
        <label className="block text-sm font-bold">Mensaje<textarea className="input mt-1.5 min-h-28" name="message"/></label>
        <button className="btn btn-primary">Crear contacto</button>
      </ActionForm>
    </div>
  );
}
