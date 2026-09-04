export type LeadSource = "whatsapp" | "formulario" | "llamada";

export type LeadStatus = "nuevo" | "contactado" | "cita" | "ganado" | "perdido";

export type TrafficSource =
  | "google"
  | "google_maps"
  | "instagram"
  | "facebook"
  | "directo"
  | "referido";

export type PlanStatus = "pendiente" | "en_progreso" | "completado";

export interface Business {
  id: string;
  name: string;
  city: string | null;
  slug: string;
  linea_score: number;
  is_demo: boolean;
  avg_client_value: number | null;
  close_rate: number;
  next_review_date: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  service: string | null;
  source: LeadSource;
  status: LeadStatus;
  value_estimate: number;
  created_at: string;
}

export interface WebsiteContent {
  id: string;
  business_id: string;
  headline: string;
  description: string;
  cta_text: string;
  phone: string;
  whatsapp: string;
  published_headline: string | null;
  published_description: string | null;
  published_cta_text: string | null;
  published_phone: string | null;
  published_whatsapp: string | null;
  updated_at: string;
  published_at: string | null;
}

export interface AnalyticsEvent {
  id: string;
  business_id: string;
  event_type: "visit";
  source: TrafficSource;
  occurred_at: string;
}

export interface ImprovementPlanItem {
  id: string;
  business_id: string;
  title: string;
  status: PlanStatus;
  position: number;
  created_at: string;
  updated_at: string;
}

export const LEAD_STATUSES: LeadStatus[] = ["nuevo", "contactado", "cita", "ganado", "perdido"];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  cita: "Cita",
  ganado: "Ganado",
  perdido: "Perdido",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  whatsapp: "WhatsApp",
  formulario: "Formulario",
  llamada: "Llamada",
};

export const TRAFFIC_SOURCE_LABELS: Record<TrafficSource, string> = {
  google: "Google",
  google_maps: "Google Maps",
  instagram: "Instagram",
  facebook: "Facebook",
  directo: "Directo",
  referido: "Referido",
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};
