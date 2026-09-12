import Link from "next/link";
import { Plus, ArrowUpRight, MessageCircle, Phone, FileCheck2, MousePointer2, UsersRound, Eye, TrendingUp, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getSessionContext } from "@/features/session/context";
import { getDashboardData } from "@/features/dashboard/data";
import { getContactos } from "@/features/leads/data";
import { requireFeature } from "@/lib/features";
import { can } from "@/lib/authz";
export default async function DashboardPage(){
 const session=await getSessionContext();requireFeature(session,"dashboard");
 const [data,leads]=await Promise.all([getDashboardData(session),getContactos(session)]);
 const icons=[Eye,MousePointer2,TrendingUp,UsersRound];
 const channels=[{label:"WhatsApp",value:data.actionCounts.whatsapp,Icon:MessageCircle},{label:"Llamadas",value:data.actionCounts.phone,Icon:Phone},{label:"Formularios",value:data.actionCounts.forms,Icon:FileCheck2}];
 const total=channels.reduce((s,c)=>s+c.value,0);
 return <div>
 <PageHeader eyebrow="Tu negocio · últimos 30 días" title="Una visión clara de tu negocio." description="Contactos, resultados y próximos pasos. Todo en un mismo lugar." action={can(session.role,"ADMIN")?<Link href="/leads/new" className="btn btn-primary"><Plus size={17}/>Nuevo contacto</Link>:null}/>
 <section aria-label="Resultados del mes" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{data.metrics.map((m,i)=>{const Icon=icons[i];return <article className={`metric ${i===1?"featured":""}`} key={m.label}><div className="metric-top"><span>{m.label}</span><Icon size={18}/></div><div className="metric-value">{m.value}</div><p className="metric-bottom">{m.delta!=="—"&&<b>{m.delta}</b>}{m.hint}</p></article>})}</section>
 <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_1fr]">
 <div className="panel p-6"><div className="section-heading"><div><h2>De visitas a oportunidades</h2><p className="mt-1 text-xs muted">{total} acciones de contacto registradas</p></div><Link href="/analytics" aria-label="Ver todos los resultados"><ArrowUpRight size={19}/></Link></div>{channels.map(({label,value,Icon})=><div className="channel-row" key={label}><span className="channel-icon"><Icon size={17}/></span><div><div className="channel-label"><span>{label}</span><span className="muted">{total?Math.round(value/total*100):0}%</span></div><div className="bar-track"><div className="bar-fill" style={{width:`${total?value/total*100:0}%`}}/></div></div><strong className="channel-value">{value}</strong></div>)}{total===0&&<p className="mt-5 text-sm muted">Aquí aparecerán las acciones cuando tu web empiece a enviar eventos.</p>}</div>
 <div className="panel p-6"><div className="section-heading"><div><h2>Las páginas que más aportan</h2><p className="mt-1 text-xs muted">Dónde nace el interés por tu negocio</p></div><Link href="/site">Ver web <ArrowUpRight size={13} className="inline"/></Link></div><div className="page-ranking">{data.pages.slice(0,4).map((p,i)=><div className="rank-row" key={p.path}><span className="rank-number">0{i+1}</span><div><strong>{p.title}</strong><small>{p.path} · {p.views} visitas</small></div><span>{p.actions}<small>acciones</small></span></div>)}</div>{!data.pages.length&&<div className="empty-state"><p>Conecta tu web para empezar a medir el rendimiento de sus páginas.</p><Link className="btn" href="/site">Configurar mi web</Link></div>}</div>
 </section>
 <section className="panel mt-6"><div className="section-heading p-6 mb-0"><div><h2>Últimos contactos</h2><p className="mt-1 text-xs muted">Cada conversación puede ser el siguiente paso.</p></div><Link href="/leads">Ver todos <ArrowUpRight size={13} className="inline"/></Link></div><div className="table-wrap"><table><thead><tr><th>Contacto</th><th>Origen</th><th>Estado</th><th>Recibido</th><th><span className="sr-only">Abrir</span></th></tr></thead><tbody>{leads.slice(0,4).map(l=><tr key={l.id}><td><Link href={`/leads/${l.id}`} className="font-bold">{l.name}</Link><div className="text-xs muted mt-1">{l.email||l.phone||"Sin datos de contacto"}</div></td><td className="muted">{l.source}</td><td><StatusBadge status={l.status}/></td><td className="muted">{new Intl.DateTimeFormat("es-ES",{day:"numeric",month:"short"}).format(new Date(l.createdAt))}</td><td><Link href={`/leads/${l.id}`} aria-label={`Abrir contacto de ${l.name}`}><ArrowUpRight size={17}/></Link></td></tr>)}</tbody></table>{!leads.length&&<div className="empty-state"><UsersRound size={28} className="muted"/><p>Todavía no hay contactos. Añade el primero o conecta el formulario de tu web.</p><Link className="btn" href="/leads/new">Añadir contacto</Link></div>}</div></section>
 <section className="recommendation"><span className="recommendation-icon"><Lightbulb size={21}/></span><div><div className="kicker">El siguiente paso</div><h2>Una mejora hoy. <span className="serif-emphasis">Más oportunidades mañana.</span></h2><p>Revisa la visibilidad de tu web y prioriza lo que tu negocio necesita.</p></div><Link href="/seo" className="btn">Revisar visibilidad <ArrowUpRight size={16}/></Link></section>
 </div>;
}
