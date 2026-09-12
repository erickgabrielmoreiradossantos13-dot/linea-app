"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, FileText, Globe2, Headphones, LayoutDashboard, Settings, UsersRound, Search, Image as ImageIcon, ShieldCheck, Menu, X, ChevronRight, LogOut, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/logo";
import type { SessionContext } from "@/features/session/context";
import { switchOrganizationAction, logout } from "@/features/session/actions";
const items = [
{href:"/dashboard",label:"Resumen",icon:LayoutDashboard,feature:"dashboard",group:"Tu negocio"},
{href:"/leads",label:"Contactos",icon:UsersRound,feature:"leads",group:"Tu negocio"},
{href:"/analytics",label:"Resultados",icon:BarChart3,feature:"analytics",group:"Tu negocio"},
{href:"/site",label:"Mi web",icon:Globe2,feature:"site",group:"Presencia digital"},
{href:"/content",label:"Editor visual",icon:FileText,feature:"content",group:"Presencia digital"},
{href:"/media",label:"Biblioteca",icon:ImageIcon,feature:"media",group:"Presencia digital"},
{href:"/seo",label:"SEO y visibilidad",icon:Search,feature:"seo",group:"Presencia digital"},
{href:"/support",label:"Solicitudes",icon:Headphones,feature:"support",group:"Tu espacio"},
{href:"/settings",label:"Configuración",icon:Settings,feature:null,group:"Tu espacio"}];
export function AppShell({session,children}:{session:SessionContext;children:React.ReactNode}) {
 const pathname=usePathname(); const [open,setOpen]=useState(false);
 const visible=items.filter(i=>!i.feature||session.role==="SUPER_ADMIN"||session.features[i.feature]);
 const current=items.find(i=>pathname.startsWith(i.href));
 return <div className="shell">
 <a className="skip-link" href="#main-content">Saltar al contenido</a>
 <div className="mobilebar"><Logo/><button className="icon-btn" aria-label={open?"Cerrar menú":"Abrir menú"} aria-expanded={open} aria-controls="app-sidebar" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div>
 {open&&<button className="nav-scrim" aria-label="Cerrar menú" onClick={()=>setOpen(false)}/>}
 <aside id="app-sidebar" className={`sidebar ${open?"is-open":""}`} onKeyDown={e=>{if(e.key==="Escape")setOpen(false)}}>
 <div className="sidebar-brand"><Logo/><span className="app-edition">APP</span></div>
 <div className="workspace-card"><span className="workspace-avatar">{session.organizationName.slice(0,1)}</span><div><strong>{session.organizationName}</strong><span>{session.isDemo?"Espacio de demostración":"Espacio de trabajo"}</span></div></div>
 {session.organizations.length>1&&<form action={switchOrganizationAction} className="org-switch"><label htmlFor="organization">Cambiar organización</label><select id="organization" name="organizationId" defaultValue={session.organizationId} className="input">{session.organizations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select><button className="btn">Cambiar</button></form>}
 <nav aria-label="Navegación principal" className="app-nav">{["Tu negocio","Presencia digital","Tu espacio"].map(group=><div className="nav-group" key={group}><p className="nav-label">{group}</p>{visible.filter(i=>i.group===group).map(({href,label,icon:Icon})=><Link key={href} href={href} onClick={()=>setOpen(false)} aria-current={pathname.startsWith(href)?"page":undefined} className={`nav-link ${pathname.startsWith(href)?"active":""}`}><Icon size={18} strokeWidth={1.7}/>{label}{pathname.startsWith(href)&&<ChevronRight size={14} className="nav-chevron"/>}</Link>)}</div>)}{session.role==="SUPER_ADMIN"&&<Link className="nav-link" href="/admin" onClick={()=>setOpen(false)}><ShieldCheck size={18}/>Administración</Link>}</nav>
 <div className="sidebar-bottom"><Link className="support-link" href="/support" onClick={()=>setOpen(false)}><Headphones size={18}/><span>Tu equipo Línea Sur<small>Estamos al otro lado</small></span><ArrowUpRight size={16}/></Link><div className="profile"><span className="profile-avatar">{session.email.slice(0,1).toUpperCase()}</span><div><strong>{session.role==="OWNER"?"Propietario":session.role==="VIEWER"?"Solo lectura":session.role==="EDITOR"?"Editor":"Administrador"}</strong><span title={session.email}>{session.email}</span></div>{!session.isDemo&&<form action={logout}><button aria-label="Cerrar sesión" className="icon-btn"><LogOut size={17}/></button></form>}</div></div>
 </aside><div className="workspace-main"><div className="topbar"><div className="breadcrumb">Línea App<ChevronRight size={14}/><strong>{current?.label??"Mi espacio"}</strong></div><div className="topbar-right"><span className="connection-tag">{session.isDemo?"Demostración":"Sesión activa"}</span><Link href="/site" className="topbar-link">Mi web <ArrowUpRight size={15}/></Link></div></div>
 <main id="main-content" className="main">{session.isDemo&&<div className="demo-banner"><span><strong>Estás explorando una demo.</strong> Datos de ejemplo; no se guardan cambios.</span><Link href="/settings">Ver configuración <ChevronRight size={14}/></Link></div>}{children}<footer className="app-footer"><span>Línea Sur Digital Studio</span><span>Tu negocio, en perspectiva. <span className="version">v0.5.0</span></span></footer></main></div></div>;
}
