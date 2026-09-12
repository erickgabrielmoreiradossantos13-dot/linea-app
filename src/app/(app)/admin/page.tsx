import { PageHeader } from "@/components/page-header";
import { getSessionContext } from "@/features/session/context";
import { canViewAdmin } from "@/lib/authz";
import { notFound } from "next/navigation";
import { getAdminSummary } from "@/features/admin/data";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default async function AdminPage() {
  const session = await getSessionContext();
  if (!canViewAdmin(session.role)) notFound();
  const summary = await getAdminSummary();

  return (
    <div>
      <PageHeader eyebrow="Línea Sur" title="Admin" description="Visão operacional do SaaS e ferramentas de suporte auditáveis."/>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["MRR","—","Stripe ainda não conectado"],
          ["Organizacciones ativas",String(summary.activeOrganizations),"clientes não arquivados"],
          ["Tickets abertos",String(summary.openTickets),"suporte pendente"],
          ["Conexiones com erro",String(summary.integrationErrors),`${summary.activeSubscriptions} assinaturas ativas/trial`]
        ].map(([label,value,hint])=><div className="metric" key={label}><div className="kicker">{label}</div><div className="mt-3 text-3xl font-black">{value}</div><div className="mt-2 text-xs text-neutral-500">{hint}</div></div>)}
      </div>
      <section className="panel mt-5 flex flex-wrap items-center justify-between gap-4 p-6">
        <div><div className="kicker">Operaciones</div><h2 className="mt-1 text-lg font-black">Solicitudes de clientes</h2><p className="mt-2 text-sm muted">Actualiza prioridad, estado y respuesta desde una cola única.</p></div>
        <Link href="/admin/support" className="btn btn-primary">Abrir soporte <ArrowUpRight size={15}/></Link>
      </section>
    </div>
  );
}
