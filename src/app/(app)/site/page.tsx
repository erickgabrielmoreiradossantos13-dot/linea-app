import Link from "next/link";
import { ExternalLink, PanelsTopLeft } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { getSessionContext } from "@/features/session/context";
import { getWebsiteSummary } from "@/features/site/data";
import { requireFeature } from "@/lib/features";
import { can } from "@/lib/authz";
import { SiteImportForm } from "@/components/site/site-import-form";
import { setWebsiteDomain, updatePageSeo } from "./actions";

export const maxDuration = 60;

export default async function SitePage() {
  const session = await getSessionContext();
  requireFeature(session, "site");
  const website = await getWebsiteSummary(session);
  const editable = can(session.role, "ADMIN");

  if (!website) {
    return <div><PageHeader eyebrow="Website" title="Mi web" description="Conecta el primer website de esta organización."/>{editable ? <ActionForm action={setWebsiteDomain} className="panel max-w-2xl p-6"><label className="text-sm font-bold">Dominio<input name="domain" className="input mt-1.5" placeholder="lineasur.online" required/></label><button className="btn btn-primary mt-4">Conectar web</button></ActionForm> : <div className="panel p-8 text-center text-sm text-neutral-500">No hay ningún website activo configurado.</div>}</div>;
  }

  return (
    <div>
      <PageHeader eyebrow="Presencia digital" title="Mi web" description="Construye, previsualiza y publica tu web desde un editor visual." action={<div className="flex gap-2"><Link className="btn btn-primary inline-flex items-center gap-2" href={`/site/${website.id}/edit`}><PanelsTopLeft size={15}/> Abrir editor</Link><a className="btn inline-flex items-center gap-2" href={`https://${website.domain}`} target="_blank" rel="noreferrer">Abrir dominio <ExternalLink size={14}/></a></div>}/>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="metric"><div className="kicker">Dominio</div><div className="mt-2 font-black">{website.domain}</div><div className="mt-2 text-xs text-emerald-700">{website.status === "ACTIVE" ? "Online" : website.status}</div></div>
        <div className="metric"><div className="kicker">Última publicación</div><div className="mt-2 font-black">{website.publishedAt ? new Intl.DateTimeFormat("es-ES",{dateStyle:"medium",timeStyle:"short"}).format(new Date(website.publishedAt)) : "Sin publicación registrada"}</div></div>
        <div className="metric"><div className="kicker">Medición</div><div className="mt-2 font-black">Por verificar</div><div className="mt-2 text-xs text-neutral-500">Eventos propios de Línea App</div></div>
      </section>
      {editable && <section className="mt-5 grid gap-5 lg:grid-cols-2"><SiteImportForm websiteId={website.id}/><ActionForm action={setWebsiteDomain} className="panel p-5"><input type="hidden" name="websiteId" value={website.id}/><div className="kicker">Configuração</div><label className="mt-3 block text-sm font-bold">Domínio<input name="domain" className="input mt-1.5" defaultValue={website.domain} required/></label><button className="btn mt-4">Guardar domínio</button></ActionForm></section>}
      <section className="panel mt-5">
        <div className="p-5"><div className="kicker">Páginas</div><h2 className="mt-1 text-lg font-black">Páginas de tu web</h2></div>
        <div className="table-wrap"><table><thead><tr><th>Página</th><th>Visitas</th><th>Acciones</th><th>Status</th></tr></thead><tbody>
          {website.pages.map(p=><tr key={p.path}><td><div className="font-bold">{p.title}</div><div className="mt-1 text-xs text-neutral-500">{p.path}</div></td><td>{p.views}</td><td>{p.actions}</td><td><div className="flex items-center gap-2"><span className="badge">{p.status}</span><Link className="btn" href={`/site/${website.id}/edit?page=${p.id}`}>Editar</Link></div></td></tr>)}
          {website.pages.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-neutral-500">Todavía no hay páginas configuradas.</td></tr>}
        </tbody></table></div>
      </section>
      {editable && website.pages.length > 0 && <section className="mt-5"><div className="section-heading"><div><div className="kicker">Buscadores</div><h2 className="mt-1 text-lg font-black">SEO de páginas</h2></div></div><div className="grid gap-4 lg:grid-cols-2">{website.pages.map((page) => <ActionForm action={updatePageSeo} className="panel p-5" key={page.id}><input type="hidden" name="pageId" value={page.id}/><div className="kicker">{page.path}</div><label className="mt-3 block text-sm font-bold">Título<input name="title" className="input mt-1.5" defaultValue={page.title} required/></label><label className="mt-3 block text-sm font-bold">Meta descrição<textarea name="metaDescription" className="input mt-1.5 min-h-20" maxLength={320} defaultValue={page.metaDescription ?? ""}/></label><label className="mt-3 flex items-center gap-2 text-sm font-bold"><input name="isIndexable" type="checkbox" defaultChecked={page.isIndexable}/> Permitir indexação</label><button className="btn mt-4">Guardar SEO</button></ActionForm>)}</div></section>}
    </div>
  );
}
