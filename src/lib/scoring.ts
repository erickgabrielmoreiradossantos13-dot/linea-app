import { STALE_DAYS } from "@/lib/insights";
import type { GoogleVisibility, ChecklistItem } from "@/lib/google";
import type { Lead, SiteContent } from "@/lib/types";

/**
 * Línea Score — cálculo puro (Fase 5). Sin dependencias de servidor: recibe
 * los datos ya cargados y devuelve números. La obtención de esos datos vive
 * en `@/lib/score.ts`; esta separación es la que permite importar los tipos
 * y las etiquetas desde un Client Component sin arrastrar `next/headers`.
 *
 * Determinista y explicable: nada de IA. Cuando una integración todavía no
 * existe (hoy, Google real), el componente usa un valor neutro en vez de
 * fabricar un número — no presentamos precisión falsa ni en positivo ni en
 * negativo.
 */

export interface ScoreBreakdown {
  visibility: number;
  conversion: number;
  seo: number;
  website: number;
  opportunities: number;
}

export interface LineaScoreResult {
  total: number;
  label: string;
  breakdown: ScoreBreakdown;
}

export const SCORE_WEIGHTS: ScoreBreakdown = {
  visibility: 0.2,
  conversion: 0.25,
  seo: 0.2,
  website: 0.15,
  opportunities: 0.2,
};

export const SCORE_COMPONENT_LABELS: Record<keyof ScoreBreakdown, string> = {
  visibility: "Visibilidad",
  conversion: "Conversión",
  seo: "SEO local",
  website: "Contenido de tu web",
  opportunities: "Gestión de oportunidades",
};

const NEUTRAL_SCORE = 50;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** Visibilidad en Google, escalada contra una referencia razonable para un negocio local. Sin Google conectado, no hay dato que juzgar: neutro. */
export function scoreVisibility(visibility: GoogleVisibility): number {
  if (!visibility.connected) return NEUTRAL_SCORE;
  const target = 15000;
  return clamp((visibility.impressions / target) * 100);
}

/** Conversión real del periodo, escalada contra un 6% (referencia sana para servicios locales). */
export function scoreConversion(conversionRate: number): number {
  if (conversionRate <= 0) return 0;
  const target = 0.06;
  return clamp((conversionRate / target) * 100);
}

/** % de puntos accionables del checklist SEO local ya resueltos (lo "managed" por Línea Sur no cuenta como pendiente del cliente). */
export function scoreSeo(seoChecklist: ChecklistItem[]): number {
  const items = seoChecklist.filter((item) => item.status !== "managed");
  if (items.length === 0) return NEUTRAL_SCORE;
  const done = items.filter((item) => item.status === "done").length;
  return clamp((done / items.length) * 100);
}

/** % de campos editables de la web que ya tienen contenido publicado. */
export function scoreWebsite(content: SiteContent | null): number {
  if (!content) return 0;
  const fields = content.schema.pages.flatMap((page) => page.sections).flatMap((section) => section.fields);
  if (fields.length === 0) return NEUTRAL_SCORE;
  const filled = fields.filter((field) => {
    const value = content.values[field.id]?.published_value;
    return typeof value === "string" ? value.trim().length > 0 : value != null;
  }).length;
  return clamp((filled / fields.length) * 100);
}

/** Penaliza contactos "Nuevo" que llevan más de STALE_DAYS sin gestionar: mide si el negocio responde a tiempo, no solo cuántas oportunidades entran. */
export function scoreOpportunities(leads: Lead[]): number {
  const newLeads = leads.filter((lead) => lead.status === "nuevo");
  if (newLeads.length === 0) return leads.length > 0 ? 100 : NEUTRAL_SCORE;

  const staleCutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
  const staleCount = newLeads.filter((lead) => new Date(lead.created_at).getTime() < staleCutoff).length;
  return clamp(100 - (staleCount / newLeads.length) * 100);
}

export function scoreLabel(total: number): string {
  if (total >= 85) return "Excelente";
  if (total >= 70) return "Muy bien";
  if (total >= 50) return "Aceptable";
  if (total >= 30) return "Necesita atención";
  return "Crítico";
}

export function computeLineaScore(breakdown: ScoreBreakdown): LineaScoreResult {
  const total = clamp(
    breakdown.visibility * SCORE_WEIGHTS.visibility +
      breakdown.conversion * SCORE_WEIGHTS.conversion +
      breakdown.seo * SCORE_WEIGHTS.seo +
      breakdown.website * SCORE_WEIGHTS.website +
      breakdown.opportunities * SCORE_WEIGHTS.opportunities
  );

  return { total, label: scoreLabel(total), breakdown };
}
