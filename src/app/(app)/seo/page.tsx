import { AlertCircle, ArrowUpRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ActionForm } from "@/components/action-form";
import { getSessionContext } from "@/features/session/context";
import { getAutomatedSeoChecks } from "@/features/seo/data";
import { requireFeature } from "@/lib/features";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canEditContent } from "@/lib/authz";
import { saveSeoCheck } from "./actions";
import { seoChecks } from "@/lib/seo-checks";

export default async function SeoPage() {
  const session = await getSessionContext();
  requireFeature(session, "seo");
  const automated = await getAutomatedSeoChecks(session);
  let completed: string[] = [];

  if (!session.isDemo) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("seo_checks")
      .select("check_key")
      .eq("organization_id", session.organizationId)
      .eq("completed", true);
    if (error) throw new Error("No se pudo cargar la lista SEO.");
    completed = (data ?? []).map((row) => row.check_key);
  }

  const percentage = Math.round((completed.length / seoChecks.length) * 100);
  const automatedPassed = automated.filter((check) => check.passed).length;

  return (
    <div>
      <PageHeader eyebrow="Presencia local · SEO y GEO" title="Haz que te encuentren." description="Señales automáticas y una lista de trabajo para buscadores y respuestas de IA." action={<Link href="/support" className="btn">Pedir ayuda <ArrowUpRight size={16}/></Link>}/>
      <section className="panel mb-5 p-6">
        <div className="section-heading"><div><h2>Diagnóstico automático</h2><p className="mt-1 text-xs muted">{automatedPassed} de {automated.length} comprobaciones correctas</p></div><Link href="/site" className="btn">Editar páginas</Link></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {automated.map((check) => <article className="rounded-xl border border-neutral-200 bg-neutral-50 p-4" key={check.key}><span className={check.passed ? "text-emerald-700" : "text-amber-700"}>{check.passed ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}</span><h3 className="mt-3 text-sm font-bold">{check.label}</h3><p className="mt-1 text-xs leading-5 muted">{check.detail}</p></article>)}
        </div>
      </section>
      <section className="panel mb-5 p-6">
        <div className="section-heading"><div><h2>Trabajo del equipo</h2><p className="mt-1 text-xs muted">{completed.length} de {seoChecks.length} revisiones completadas</p></div><strong className="text-3xl">{percentage}%</strong></div>
        <div className="bar-track"><div className="bar-fill" style={{ width: `${percentage}%` }}/></div>
        <p className="mt-4 text-xs muted">Las comprobaciones automáticas cubren la configuración interna. Las tareas siguientes requieren revisión humana y no garantizan posiciones.</p>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {seoChecks.map((check) => {
          const done = completed.includes(check.key);
          return (
            <article className="panel p-6" key={check.key}>
              <div className="flex gap-3"><span className={done ? "text-emerald-700" : "muted"}>{done ? <CheckCircle2 size={21}/> : <Circle size={21}/>}</span><div><span className="kicker">{check.category}</span><h2 className="mt-1 font-bold">{check.title}</h2><p className="mt-2 text-sm leading-6 muted">{check.description}</p></div></div>
              <div className="mt-5 flex items-center justify-between gap-3"><a href={check.url} target="_blank" rel="noreferrer" className="text-sm underline muted">Abrir recurso</a>{canEditContent(session.role) && <ActionForm action={saveSeoCheck}><input type="hidden" name="key" value={check.key}/><input type="hidden" name="completed" value={done ? "false" : "true"}/><button className="btn">{done ? "Marcar pendiente" : "Marcar completado"}</button></ActionForm>}</div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
