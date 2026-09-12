import type { Lead, Metric, Organization } from "@/lib/types";

export const demoOrganization: Organization = {
  id: "4bd86e22-45a4-4af8-8e8c-45e6b827b7f3",
  name: "DEMO · Clínica Dental Málaga Centro",
  slug: "clinica-dental-malaga-centro",
  plan: "GROWTH",
};

export const demoMetrics: Metric[] = [
  { label: "Visitas", value: "1.482", delta: "+12,4%", hint: "visitas a la web este mes" },
  { label: "Acciones de contacto", value: "76", delta: "+18,8%", hint: "WhatsApp, llamadas y formularios" },
  { label: "Acciones por visita", value: "5,1%", delta: "+0,3 pp", hint: "acciones por cada 100 visitas" },
  { label: "Contactos", value: "41", delta: "+9,3%", hint: "contactos recibidos este mes" }
];

export const demoContactos: Lead[] = [
  { id:"9ca0897b-6ed1-43bb-9810-0105985ca600", organizationId:demoOrganization.id, name:"María López", email:"maria@example.com", phone:"+34 611 230 811", source:"Google", page:"/implantes-dentales", status:"NEW", createdAt:"2026-09-09T08:42:00Z", message:"Quería información sobre implantes." },
  { id:"5a4889c8-ff47-4bdc-a5e4-81bb3ffcf239", organizationId:demoOrganization.id, name:"Daniel Evans", email:"daniel@example.com", phone:"+34 678 442 902", source:"Google Maps", page:"/urgencias-dentales", status:"CONTACTED", createdAt:"2026-09-08T14:10:00Z", message:"Do you have an appointment today?" },
  { id:"bf6310d4-e28e-472a-89bc-f62109818053", organizationId:demoOrganization.id, name:"Lucía Moreno", phone:"+34 691 004 015", source:"Instagram", page:"/ortodoncia-invisible", status:"QUALIFIED", createdAt:"2026-09-07T11:22:00Z", message:"Interesada en Invisalign." },
  { id:"8cb61b16-ce2a-4e84-bcec-b04bf45c9970", organizationId:demoOrganization.id, name:"Pedro Sánchez", email:"pedro@example.com", source:"Directo", page:"/contacto", status:"MEETING", createdAt:"2026-09-06T09:55:00Z" },
  { id:"40b3a28d-730b-4eab-b8ca-052cd92d02c6", organizationId:demoOrganization.id, name:"Sophie Martin", phone:"+34 622 119 224", source:"Google", page:"/blanqueamiento", status:"WON", createdAt:"2026-09-03T16:20:00Z" }
];

export const demoPages = [
  { path:"/", title:"Clínica Dental en Málaga", status:"Publicada", views:612, actions:34 },
  { path:"/implantes-dentales", title:"Implantes dentales", status:"Publicada", views:328, actions:22 },
  { path:"/ortodoncia-invisible", title:"Ortodoncia invisible", status:"Publicada", views:247, actions:13 },
  { path:"/urgencias-dentales", title:"Urgencias dentales", status:"Publicada", views:196, actions:7 }
];

export const demoContent = [
  { key:"home.hero.title", label:"Título principal", value:"Tu clínica dental de confianza en el centro de Málaga", section:"Inicio · Hero" },
  { key:"home.hero.subtitle", label:"Subtítulo", value:"Odontología moderna, trato cercano y citas sin complicaciones.", section:"Inicio · Hero" },
  { key:"contact.phone", label:"Teléfono", value:"+34 952 000 000", section:"Contacto" },
  { key:"contact.whatsapp", label:"WhatsApp", value:"+34 611 000 000", section:"Contacto" }
];
