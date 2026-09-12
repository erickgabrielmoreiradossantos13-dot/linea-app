import { PageHeader } from "@/components/page-header";
import { getSessionContext } from "@/features/session/context";
import { getDashboardData } from "@/features/dashboard/data";
import { requireFeature } from "@/lib/features";

export default async function ResultadosPage() {
  const session = await getSessionContext();
  requireFeature(session, "analytics");
  const data = await getDashboardData(session);
  return (
    <div>
      <PageHeader eyebrow="Actividad de tu web" title="Resultados" description="Entiende qué canales generan contactos y qué páginas funcionan mejor."/>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map(m=><div className="metric" key={m.label}><div className="text-sm font-bold">{m.label}</div><div className="mt-3 text-3xl font-black">{m.value}</div><div className="mt-2 text-xs text-neutral-500">{m.hint}</div></div>)}
      </div>
      <section className="panel mt-5 p-5">
        <div className="kicker">Acciones por canal</div>
        <div className="mt-5 space-y-4">
          {[
            ["WhatsApp",data.actionCounts.whatsapp],
            ["Llamadas",data.actionCounts.phone],
            ["Formularios",data.actionCounts.forms]
          ].map(([label,value])=> {
            const max = Math.max(1, data.actionCounts.whatsapp, data.actionCounts.phone, data.actionCounts.forms);
            const pct = (Number(value) / max) * 100;
            return <div key={String(label)}><div className="mb-2 flex justify-between text-sm"><span className="font-bold">{label}</span><span>{value} acciones</span></div><div className="h-2 rounded-full bg-neutral-100"><div className="h-2 rounded-full bg-[#1e3a34]" style={{width:`${pct}%`}}/></div></div>
          })}
        </div>
      </section>
    </div>
  );
}
