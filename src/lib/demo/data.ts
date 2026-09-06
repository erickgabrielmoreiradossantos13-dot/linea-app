import type {
  Business,
  ImprovementPlanItem,
  Lead,
  LeadSource,
  LeadStatus,
  PlanStatus,
  SupportRequest,
  TrafficSource,
} from "@/lib/types";

export const DEMO_EMAIL = "demo@lineasur.app";
export const DEMO_PASSWORD = "LineaDemo2026!";

export const DEMO_BUSINESS: Business = {
  id: "demo-business-clinica-aurora",
  name: "Clínica Aurora",
  city: "Málaga",
  slug: "clinica-aurora",
  linea_score: 78,
  is_demo: true,
  avg_client_value: 550,
  close_rate: 0.3,
  next_review_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
};

// El contenido de la web ahora vive en el esquema genérico de sitios
// (ver src/lib/demo/site.ts), no en un objeto de forma fija.

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

// Periodo anterior (30-59 días), mismos totales que supabase/seed.sql, para que
// las comparaciones "vs. mes anterior" coincidan entre modo demo y modo real.
const PREVIOUS_TOTAL_VISITORS = 1980;
const PREVIOUS_TOTAL_LEADS = 64;

function sourceForLead(gs: number): LeadSource {
  if (gs <= 51) return "whatsapp";
  if (gs <= 70) return "formulario";
  return "llamada";
}

function trafficSourceForVisit(i: number): TrafficSource {
  const r = i % 10;
  if (r <= 1) return "google";
  if (r === 2) return "google_maps";
  if (r <= 4) return "instagram";
  if (r <= 6) return "facebook";
  if (r <= 8) return "directo";
  return "referido";
}

// Páginas reales del sitio de Clínica Aurora (no todas viven todavía en el
// esquema editable, pero sí existen en la web publicada y reciben tráfico).
const LANDING_PAGES = ["/", "/servicios", "/implantes-dentales", "/contacto"];

const MEDIUM_BY_SOURCE: Record<TrafficSource, string> = {
  google: "organic",
  google_maps: "maps",
  instagram: "social",
  facebook: "social",
  directo: "direct",
  referido: "referral",
};

export function generateDemoLeads(): Lead[] {
  const leads: Lead[] = [];

  for (let gs = 1; gs <= TOTAL_LEADS; gs++) {
    const name = NAMES[gs % NAMES.length];
    const surname = SURNAMES[(gs * 7) % SURNAMES.length];
    const daysAgo = Math.max(0, 29 - Math.floor(29 * (gs / TOTAL_LEADS)) - (gs % 3));
    const secondsOffset = (gs * 53) % 86400;
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - secondsOffset * 1000);
    const trafficSource = trafficSourceForVisit(gs);

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
      traffic_source: trafficSource,
      traffic_medium: MEDIUM_BY_SOURCE[trafficSource],
      campaign: null,
      landing_page: LANDING_PAGES[gs % LANDING_PAGES.length],
      referrer: trafficSource === "referido" ? "clinicasmalaga.directorio.es" : null,
    });
  }

  return leads.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getDemoTrafficCounts(): Record<TrafficSource, number> {
  const counts: Record<TrafficSource, number> = {
    google: 0,
    google_maps: 0,
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
export const DEMO_PREVIOUS_TOTAL_VISITORS = PREVIOUS_TOTAL_VISITORS;
export const DEMO_PREVIOUS_TOTAL_LEADS = PREVIOUS_TOTAL_LEADS;

// ---------------------------------------------------------------------------
// Visibilidad en Google — ILUSTRATIVO. No hay integración real con Google
// Search Console todavía; estos números solo existen en modo demo para poder
// enseñar cómo se verá la sección una vez conectada. Ver src/lib/google.ts.
// ---------------------------------------------------------------------------
export const DEMO_GOOGLE_VISIBILITY = {
  impressions: 14326,
  impressionsDelta: 0.18,
  clicksFromGoogle: 612,
  topQueries: [
    "dentista málaga",
    "implantes dentales málaga",
    "clínica dental centro málaga",
    "urgencias dentista málaga",
  ],
};

// ---------------------------------------------------------------------------
// Plan de mejora — demo. En modo real proviene de la tabla
// improvement_plan_items (gestionada por Línea Sur para cada cliente).
// ---------------------------------------------------------------------------
export const DEMO_IMPROVEMENT_PLAN: ImprovementPlanItem[] = [
  {
    id: "demo-plan-1",
    business_id: DEMO_BUSINESS.id,
    title: "Mejorar la página de tratamientos",
    status: "completado" as PlanStatus,
    position: 1,
    category: "contenido",
    priority: "alta",
    description: "El texto de tratamientos era genérico y no explicaba precios ni proceso.",
    impact: "Más confianza antes de contactar, menos preguntas repetidas por WhatsApp.",
    target_date: null,
    result: "La página ahora explica cada tratamiento con precio orientativo y pasos claros.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    id: "demo-plan-2",
    business_id: DEMO_BUSINESS.id,
    title: "Optimizar el perfil de Google Negocio",
    status: "completado",
    position: 2,
    category: "google",
    priority: "alta",
    description: "Horarios, fotos y categoría del perfil de Google Negocio desactualizados.",
    impact: "Mejor visibilidad en Google Maps para búsquedas locales.",
    target_date: null,
    result: "Perfil actualizado con horarios, fotos nuevas y categoría correcta.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: "demo-plan-3",
    business_id: DEMO_BUSINESS.id,
    title: 'Crear página "Implantes dentales Málaga"',
    status: "en_progreso",
    position: 3,
    category: "seo_local",
    priority: "alta",
    description: "No existe una página específica para la búsqueda más frecuente de la clínica.",
    impact: "Más posibilidades de aparecer cuando alguien busca implantes en Málaga.",
    target_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
    result: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "demo-plan-4",
    business_id: DEMO_BUSINESS.id,
    title: "Mejorar la conversión en móvil",
    status: "planificado",
    position: 4,
    category: "conversion",
    priority: "media",
    description: "El botón de WhatsApp queda por debajo de la pantalla en móvil.",
    impact: "Más contactos desde móvil, donde llega la mayoría del tráfico.",
    target_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
    result: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "demo-plan-5",
    business_id: DEMO_BUSINESS.id,
    title: "Añadir reseñas de clientes en la web",
    status: "recomendado",
    position: 5,
    category: "diseno_ux",
    priority: "media",
    description: "La web no muestra ninguna prueba social todavía.",
    impact: "Más confianza para quien llega desde Google o redes sociales.",
    target_date: null,
    result: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Solicitudes — demo. En modo real proviene de support_requests. Las que crea
// el usuario en modo demo se guardan en cookie y se añaden a este listado
// (ver src/lib/demo/store.ts y src/lib/support.ts).
// ---------------------------------------------------------------------------
export const DEMO_SUPPORT_REQUESTS: SupportRequest[] = [
  {
    id: "demo-support-1",
    business_id: DEMO_BUSINESS.id,
    created_by: null,
    title: "Cambiar el horario de sábados",
    description: "Ahora abrimos los sábados de 10:00 a 14:00, antes no abríamos.",
    category: "cambio_contenido",
    priority: "media",
    status: "resuelta",
    response_notes: "Horario actualizado en la web y en el perfil de Google.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString(),
  },
  {
    id: "demo-support-2",
    business_id: DEMO_BUSINESS.id,
    created_by: null,
    title: "Añadir sección de financiación",
    description: "Nos gustaría explicar en la web que ofrecemos financiación a 12 meses sin intereses.",
    category: "nueva_seccion",
    priority: "media",
    status: "en_progreso",
    response_notes: "Estamos maquetando la sección, calculamos tenerla lista esta semana.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: "demo-support-3",
    business_id: DEMO_BUSINESS.id,
    created_by: null,
    title: "El formulario no envía confirmación por email",
    description: "Un par de pacientes nos han dicho que no reciben el email de confirmación al pedir cita.",
    category: "problema_tecnico",
    priority: "alta",
    status: "recibida",
    response_notes: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
];
