import { IS_DEMO_MODE } from "@/lib/demo/config";
import { DEMO_GOOGLE_VISIBILITY } from "@/lib/demo/data";
import type { SiteContent } from "@/lib/types";

export type GoogleVisibility =
  | { connected: false }
  | {
      connected: true;
      impressions: number;
      impressionsDelta: number;
      clicksFromGoogle: number;
      topQueries: string[];
    };

/**
 * Línea App todavía no integra Google Search Console (fuera del alcance del V0).
 * En modo real devolvemos "no conectado" en vez de inventar cifras; en modo demo
 * mostramos datos ilustrativos claramente separados (ver src/lib/demo/data.ts)
 * para poder enseñar cómo se verá la sección una vez conectada.
 */
export async function getGoogleVisibility(): Promise<GoogleVisibility> {
  if (IS_DEMO_MODE) {
    return { connected: true, ...DEMO_GOOGLE_VISIBILITY };
  }

  return { connected: false };
}

export type ChecklistStatus = "done" | "pending" | "managed";

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus;
  note: string;
}

function fieldValue(content: SiteContent | null, sectionKey: string, fieldKey: string): string {
  if (!content) return "";
  const field = content.schema.pages
    .flatMap((p) => p.sections)
    .find((s) => s.key === sectionKey)
    ?.fields.find((f) => f.key === fieldKey);
  if (!field) return "";
  const value = content.values[field.id]?.published_value;
  return typeof value === "string" ? value : "";
}

/**
 * Checklists reales (no inventadas): se derivan del contenido publicado que
 * ya existe en el sitio. Lo que Línea App todavía no puede verificar (perfil
 * de Google, reseñas) se marca honestamente como pendiente, nunca como hecho.
 */
export function getSeoLocalChecklist(content: SiteContent | null): ChecklistItem[] {
  const hasTitle = fieldValue(content, "hero", "title").length > 10;
  const hasPhone = fieldValue(content, "contact", "phone").length > 0;

  return [
    {
      id: "title-description",
      label: "Título y descripción claros en la portada",
      status: hasTitle ? "done" : "pending",
      note: hasTitle
        ? "Tu portada explica qué haces y para quién."
        : "Añade un título más descriptivo desde Mi Web.",
    },
    {
      id: "contact-visible",
      label: "Teléfono y WhatsApp visibles",
      status: hasPhone ? "done" : "pending",
      note: hasPhone ? "Los datos de contacto están publicados." : "Añade tu teléfono desde Mi Web.",
    },
    {
      id: "service-pages",
      label: "Una página por servicio o tratamiento principal",
      status: "pending",
      note: "Todavía solo tienes la página de Inicio conectada al editor. Pídelo desde Solicitudes.",
    },
    {
      id: "google-business-profile",
      label: "Perfil de Google Business Profile optimizado",
      status: "pending",
      note: "Todavía no está conectado a Línea App. Pregúntanos si quieres que lo revisemos.",
    },
    {
      id: "reviews",
      label: "Reseñas de clientes visibles en la web",
      status: "pending",
      note: "Todavía no hay reseñas publicadas en tu web.",
    },
  ];
}

export function getGeoAiChecklist(content: SiteContent | null): ChecklistItem[] {
  const hasBusinessInfo = fieldValue(content, "hero", "subtitle").length > 20;
  const hasPhone = fieldValue(content, "contact", "phone").length > 0;

  return [
    {
      id: "entity-info",
      label: "Información clara de qué hace el negocio",
      status: hasBusinessInfo ? "done" : "pending",
      note: hasBusinessInfo
        ? "Tu descripción ayuda a que se entienda bien qué ofreces."
        : "Amplía la descripción de tu negocio desde Mi Web.",
    },
    {
      id: "consistent-contact",
      label: "Teléfono y WhatsApp consistentes",
      status: hasPhone ? "done" : "pending",
      note: hasPhone ? "Tus datos de contacto son consistentes." : "Añade tu teléfono desde Mi Web.",
    },
    {
      id: "faqs",
      label: "Preguntas frecuentes estructuradas",
      status: "pending",
      note: "Todavía no tienes una sección de preguntas frecuentes.",
    },
    {
      id: "structured-data",
      label: "Datos estructurados (schema.org)",
      status: "managed",
      note: "Esto lo configura el equipo técnico de Línea Sur al construir tu web.",
    },
  ];
}
