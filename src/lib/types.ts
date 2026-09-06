export type LeadSource = "whatsapp" | "formulario" | "llamada";

export type LeadStatus = "nuevo" | "contactado" | "cita" | "ganado" | "perdido";

export type TrafficSource =
  | "google"
  | "google_maps"
  | "instagram"
  | "facebook"
  | "directo"
  | "referido";

export type PlanStatus = "recomendado" | "planificado" | "en_progreso" | "completado" | "descartado";
export type PlanCategory =
  | "conversion"
  | "contenido"
  | "seo_local"
  | "geo_ia"
  | "google"
  | "rendimiento"
  | "diseno_ux"
  | "tecnico";
export type PlanPriority = "alta" | "media" | "baja";

export type SupportCategory =
  | "cambio_contenido"
  | "nueva_seccion"
  | "problema_tecnico"
  | "seo_google"
  | "nueva_funcionalidad"
  | "otro";
export type SupportPriority = "alta" | "media" | "baja";
export type SupportStatus = "recibida" | "revisando" | "en_progreso" | "resuelta";

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
  /** Atribución básica: de dónde vino esta oportunidad (puede faltar en leads antiguos). */
  traffic_source: TrafficSource | null;
  traffic_medium: string | null;
  campaign: string | null;
  landing_page: string | null;
  referrer: string | null;
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
  category: PlanCategory | null;
  priority: PlanPriority;
  description: string | null;
  impact: string | null;
  target_date: string | null;
  result: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportRequest {
  id: string;
  business_id: string;
  created_by: string | null;
  title: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  response_notes: string | null;
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
  recomendado: "Recomendado",
  planificado: "Planificado",
  en_progreso: "En progreso",
  completado: "Completado",
  descartado: "Descartado",
};

export const PLAN_CATEGORY_LABELS: Record<PlanCategory, string> = {
  conversion: "Conversión",
  contenido: "Contenido",
  seo_local: "SEO local",
  geo_ia: "GEO / IA",
  google: "Google",
  rendimiento: "Rendimiento",
  diseno_ux: "Diseño / UX",
  tecnico: "Técnico",
};

export const PLAN_PRIORITY_LABELS: Record<PlanPriority, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  cambio_contenido: "Cambio de contenido",
  nueva_seccion: "Nueva sección",
  problema_tecnico: "Problema técnico",
  seo_google: "SEO / Google",
  nueva_funcionalidad: "Nueva funcionalidad",
  otro: "Otro",
};

export const SUPPORT_PRIORITY_LABELS: Record<SupportPriority, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  recibida: "Recibida",
  revisando: "Revisando",
  en_progreso: "En progreso",
  resuelta: "Resuelta",
};

// =========================================================
// Site / Editable Schema / Editor
// =========================================================

export type SiteStatus = "draft" | "published";

export interface Site {
  id: string;
  business_id: string;
  name: string;
  domain: string | null;
  preview_url: string | null;
  production_url: string | null;
  framework: string;
  status: SiteStatus;
  last_published_at: string | null;
  created_at: string;
}

export type FieldType =
  | "text"
  | "textarea"
  | "rich_text"
  | "number"
  | "price"
  | "image"
  | "gallery"
  | "url"
  | "email"
  | "phone"
  | "color"
  | "select"
  | "boolean"
  | "date"
  | "opening_hours"
  | "location"
  | "collection";

export interface SitePage {
  id: string;
  site_id: string;
  slug: string;
  name: string;
  position: number;
}

export interface SiteSection {
  id: string;
  page_id: string;
  key: string;
  name: string;
  position: number;
}

export interface FieldConfig {
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Solo para field_type "collection" */
  itemFields?: { key: string; label: string; type: FieldType }[];
  maxItems?: number;
  canCreate?: boolean;
  canDelete?: boolean;
  canReorder?: boolean;
}

export interface SiteField {
  id: string;
  section_id: string;
  key: string;
  label: string;
  field_type: FieldType;
  position: number;
  config: FieldConfig;
  editable_by_client: boolean;
}

export interface SiteFieldValue {
  field_id: string;
  draft_value: unknown;
  published_value: unknown;
  updated_at: string;
  published_at: string | null;
}

export interface SiteCollectionItem {
  id: string;
  field_id: string;
  position: number;
  draft_data: Record<string, unknown>;
  published_data: Record<string, unknown> | null;
  is_hidden: boolean;
}

export interface SiteChangeLogEntry {
  id: string;
  site_id: string;
  actor_email: string | null;
  summary: string;
  /** Valores publicados (por field_id) en el momento de esta publicación. Permite "Restaurar". */
  snapshot: Record<string, unknown> | null;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  business_id: string;
  storage_path: string;
  url: string;
  filename: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
}

/** El esquema completo de un sitio: páginas → secciones → campos. */
export interface SiteSchema {
  site: Site;
  pages: (SitePage & {
    sections: (SiteSection & { fields: SiteField[] })[];
  })[];
}

/** Esquema + contenido actual (borrador) de cada campo, listo para el editor. */
export interface SiteContent {
  schema: SiteSchema;
  values: Record<string, SiteFieldValue>;
  collectionItems: Record<string, SiteCollectionItem[]>;
}
