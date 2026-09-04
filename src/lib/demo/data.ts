import type { Business, Lead, LeadSource, LeadStatus, TrafficSource, WebsiteContent } from "@/lib/types";

export const DEMO_EMAIL = "demo@lineasur.app";
export const DEMO_PASSWORD = "LineaDemo2026!";

export const DEMO_BUSINESS: Business = {
  id: "demo-business-clinica-aurora",
  name: "Clínica Aurora",
  city: "Málaga",
  slug: "clinica-aurora",
  linea_score: 78,
  is_demo: true,
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
};

const DEMO_WEBSITE_HEADLINE = "Cuida tu sonrisa con los mejores especialistas de Málaga";
const DEMO_WEBSITE_DESCRIPTION =
  "En Clínica Aurora combinamos tecnología avanzada y trato cercano para ofrecerte tratamientos dentales de máxima calidad.";
const DEMO_WEBSITE_CTA = "Pide tu cita";
const DEMO_WEBSITE_PHONE = "+34 951 234 567";
const DEMO_WEBSITE_WHATSAPP = "+34 611 222 333";

export const DEMO_WEBSITE_CONTENT: WebsiteContent = {
  id: "demo-website-clinica-aurora",
  business_id: DEMO_BUSINESS.id,
  headline: DEMO_WEBSITE_HEADLINE,
  description: DEMO_WEBSITE_DESCRIPTION,
  cta_text: DEMO_WEBSITE_CTA,
  phone: DEMO_WEBSITE_PHONE,
  whatsapp: DEMO_WEBSITE_WHATSAPP,
  published_headline: DEMO_WEBSITE_HEADLINE,
  published_description: DEMO_WEBSITE_DESCRIPTION,
  published_cta_text: DEMO_WEBSITE_CTA,
  published_phone: DEMO_WEBSITE_PHONE,
  published_whatsapp: DEMO_WEBSITE_WHATSAPP,
  updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
};

// Mismos parámetros deterministas que supabase/seed.sql, para que el modo
// demo (sin base de datos) muestre datos con la misma forma que el seed real.
const NAMES = [
  "Laura", "Carlos", "María", "Javier", "Ana", "Pedro", "Lucía", "Diego", "Elena", "Sergio",
  "Marta", "Alejandro", "Cristina", "Pablo", "Sara", "Miguel", "Beatriz", "Raúl", "Nuria", "Iván",
];
const SURNAMES = [
  "Gómez", "Ruiz", "Fernández", "López", "Martín", "Sánchez", "Torres", "Romero", "Navarro", "Ortega",
  "Jiménez", "Molina", "Delgado", "Castro", "Ramos", "Vega", "Iglesias", "Serrano", "Campos", "Herrera",
];
const SERVICES = ["Implantes", "Ortodoncia", "Estética dental", "Revisión general", "Blanqueamiento"];
const PRICES = [450, 300, 180, 60, 90];
const STATUSES: LeadStatus[] = [
  "nuevo", "nuevo", "contactado", "contactado", "cita", "ganado", "ganado", "perdido", "nuevo", "contactado",
];

const TOTAL_LEADS = 83;
const TOTAL_VISITORS = 2418;

function sourceForLead(gs: number): LeadSource {
  if (gs <= 51) return "whatsapp";
  if (gs <= 70) return "formulario";
  return "llamada";
}

function trafficSourceForVisit(i: number): TrafficSource {
  const r = i % 10;
  if (r <= 2) return "google";
  if (r <= 4) return "instagram";
  if (r <= 6) return "facebook";
  if (r <= 8) return "directo";
  return "referido";
}

export function generateDemoLeads(): Lead[] {
  const leads: Lead[] = [];

  for (let gs = 1; gs <= TOTAL_LEADS; gs++) {
    const name = NAMES[gs % NAMES.length];
    const surname = SURNAMES[(gs * 7) % SURNAMES.length];
    const daysAgo = Math.max(0, 29 - Math.floor(29 * (gs / TOTAL_LEADS)) - (gs % 3));
    const secondsOffset = (gs * 53) % 86400;
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - secondsOffset * 1000);

    leads.push({
      id: `demo-lead-${gs}`,
      business_id: DEMO_BUSINESS.id,
      name: `${name} ${surname}`,
      phone: `+34 6${String((gs * 123457) % 100000000).padStart(8, "0")}`,
      email: `${name.toLowerCase()}.${surname.toLowerCase()}${gs}@ejemplo.com`,
      service: SERVICES[gs % SERVICES.length],
      source: sourceForLead(gs),
      status: STATUSES[gs % STATUSES.length],
      value_estimate: PRICES[gs % PRICES.length],
      created_at: createdAt.toISOString(),
    });
  }

  return leads.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getDemoTrafficCounts(): Record<TrafficSource, number> {
  const counts: Record<TrafficSource, number> = {
    google: 0,
    instagram: 0,
    facebook: 0,
    directo: 0,
    referido: 0,
  };

  for (let i = 1; i <= TOTAL_VISITORS; i++) {
    counts[trafficSourceForVisit(i)] += 1;
  }

  return counts;
}

export const DEMO_TOTAL_VISITORS = TOTAL_VISITORS;
