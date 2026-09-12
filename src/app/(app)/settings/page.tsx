import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { getSessionContext } from "@/features/session/context";
import { getOrganizationMembers, getOrganizationSettings } from "@/features/settings/data";
import { can, canManageMembers } from "@/lib/authz";
import { inviteOrganizationMember, updateOrganizationAction } from "./actions";

export default async function SettingsPage() {
  const session = await getSessionContext();
  const [settings, members] = await Promise.all([
    getOrganizationSettings(session),
    getOrganizationMembers(session),
  ]);
  const editable = can(session.role, "ADMIN");
  const canInvite = canManageMembers(session.role);

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Organización" title="Configuración" description="Gestiona tu organización y revisa sus conexiones."/>
      <ActionForm action={updateOrganizationAction} className="panel p-6">
        <div className="kicker">Empresa</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">Nombre<input name="name" className="input mt-1.5" defaultValue={settings.name} readOnly={!editable}/></label>
          <label className="text-sm font-bold">Plan<input className="input mt-1.5" value={settings.planCode} readOnly/></label>
          <label className="text-sm font-bold sm:col-span-2">Website<input className="input mt-1.5" value={settings.website ?? "Ninguna web conectada"} readOnly/></label>
        </div>
        {editable && <button className="btn btn-primary mt-5">Guardar</button>}
      </ActionForm>
      <section className="panel mt-5 p-6">
        <div className="kicker">Conexiones</div>
        <p className="mt-3 text-sm leading-6 text-neutral-500">Las métricas de Línea App se calculan con eventos de tu web. Google Resultados, Search Console y Business Profile requieren una conexión adicional.</p>
      </section>
      <section className="panel mt-5 p-6">
        <div className="kicker">Equipo</div>
        <h2 className="mt-1 text-lg font-black">Personas con acceso</h2>
        <div className="mt-4 divide-y divide-neutral-100">
          {members.map((member) => <div className="flex flex-wrap items-center justify-between gap-3 py-4" key={member.id}><div><strong className="text-sm">{member.name}</strong><p className="mt-1 text-xs muted">{member.email}</p></div><div className="flex items-center gap-2"><span className="badge">{member.role}</span><span className="badge">{member.status}</span></div></div>)}
          {members.length === 0 && <p className="py-5 text-sm muted">No hay miembros registrados.</p>}
        </div>
        {canInvite && <ActionForm action={inviteOrganizationMember} className="mt-5 grid gap-4 border-t border-neutral-200 pt-5 sm:grid-cols-2"><label className="text-sm font-bold">Nombre<input name="name" className="input mt-1.5" required placeholder="Nombre y apellidos"/></label><label className="text-sm font-bold">Email<input name="email" type="email" className="input mt-1.5" required placeholder="persona@empresa.com"/></label><label className="text-sm font-bold">Rol<select name="role" className="input mt-1.5" defaultValue="EDITOR"><option value="ADMIN">Administrador</option><option value="EDITOR">Editor</option><option value="VIEWER">Solo lectura</option></select></label><div className="flex items-end"><button className="btn btn-primary w-full">Enviar invitación</button></div></ActionForm>}
      </section>
    </div>
  );
}
