import type { DashboardMetrics } from "@/lib/dashboard";
import type { Lead } from "@/lib/types";

export type InsightPriority = "alta" | "atencion" | "oportunidad" | "mejora";

export interface InsightAction {
  label: string;
  href: string;
}

export interface OpportunityInsight {
  id: string;
  priority: InsightPriority;
  title: string;
  explanation: string;
  recommendation: string;
  /** Impacto comercial esperado si se actúa sobre esto (una frase, no jerga técnica). */
  impact?: string;
  /** Ejemplo ilustrativo (solo modo demo): requiere datos que aún no existen. */
  illustrative?: boolean;
  /** Dónde puede actuar el usuario (Mi Web, Contactos, Plan, Google...). Máx. 2 por tarjeta. */
  actions?: InsightAction[];
}

const STALE_DAYS = 3;

/**
 * Motor de reglas (no IA): genera tarjetas de "Oportunidades" a partir de
 * datos reales ya calculados (métricas del periodo actual/anterior y leads).
 * Si ninguna regla se activa, la página muestra un estado vacío honesto.
 */
export function getOpportunityInsights(
  metrics: DashboardMetrics,
  leads: Lead[]
): OpportunityInsight[] {
  const insights: OpportunityInsight[] = [];

  // 1) Conversión a la baja
  if (
    metrics.conversionDelta.direction === "down" &&
    metrics.conversionDelta.percent !== null &&
    metrics.conversionDelta.percent <= -0.05
  ) {
    insights.push({
      id: "conversion-down",
      priority: "alta",
      title: "Tu conversión ha bajado este mes",
      explanation: `De cada 100 visitantes, antes se convertían en contacto ${(
        metrics.previousConversionRate * 100
      ).toFixed(1)} y ahora ${(metrics.conversionRate * 100).toFixed(1)}.`,
      recommendation:
        "Revisa el formulario de contacto, el botón de WhatsApp y las llamadas a la acción de tu web: pequeños cambios ahí suelen recuperar la conversión.",
      impact: "Recuperar la conversión anterior podría suponer varias oportunidades más al mes sin gastar en más visitas.",
      actions: [{ label: "Editar página", href: "/dashboard/website/edit" }],
    });
  }

  // 2) Las visitas suben pero las oportunidades no acompañan (a vigilar, no urgente)
  if (
    metrics.visitorsDelta.direction === "up" &&
    metrics.visitorsDelta.percent !== null &&
    metrics.visitorsDelta.percent >= 0.1 &&
    metrics.opportunitiesDelta.direction !== "up"
  ) {
    insights.push({
      id: "traffic-not-converting",
      priority: "atencion",
      title: "Más visitas, pero no se traducen en más contactos",
      explanation: `Tus visitas subieron un ${Math.round(
        metrics.visitorsDelta.percent * 100
      )}% este mes, pero las oportunidades generadas no crecieron al mismo ritmo.`,
      recommendation:
        "Revisa la velocidad de carga de tu web y si el teléfono, WhatsApp y formulario están bien visibles nada más entrar.",
      impact: "Estás pagando (en visibilidad) por ese tráfico extra: que convierta es la diferencia entre visitas y clientes.",
      actions: [{ label: "Editar página", href: "/dashboard/website/edit" }],
    });
  }

  // 3) Leads nuevos sin gestionar
  const staleCutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
  const staleCount = leads.filter(
    (lead) => lead.status === "nuevo" && new Date(lead.created_at).getTime() < staleCutoff
  ).length;

  if (staleCount > 0) {
    insights.push({
      id: "stale-new-leads",
      priority: "alta",
      title: `${staleCount} ${staleCount === 1 ? "contacto lleva" : "contactos llevan"} más de ${STALE_DAYS} días sin gestionar`,
      explanation:
        "Cuanto más tiempo pasa sin responder a un contacto nuevo, más difícil es que termine convirtiéndose en cliente.",
      recommendation: `Entra en Contactos y responde a los que siguen como "Nuevo" hace más de ${STALE_DAYS} días.`,
      impact: "Cada día de retraso reduce las posibilidades de que ese contacto termine siendo cliente.",
      actions: [{ label: "Ver contactos", href: "/dashboard/leads?status=nuevo" }],
    });
  }

  // 4) Mejora positiva: oportunidades al alza
  if (
    metrics.opportunitiesDelta.direction === "up" &&
    metrics.opportunitiesDelta.percent !== null &&
    metrics.opportunitiesDelta.percent >= 0.1
  ) {
    insights.push({
      id: "opportunities-up",
      priority: "mejora",
      title: "Las oportunidades van en aumento",
      explanation: `Generaste un ${Math.round(
        metrics.opportunitiesDelta.percent * 100
      )}% más de contactos que el periodo anterior.`,
      recommendation: "Mantén la web actualizada y sigue respondiendo rápido: es lo que está funcionando.",
      impact: "Mantener este ritmo se traduce directamente en más clientes potenciales cada mes.",
      actions: [{ label: "Ver informe del mes", href: "/dashboard/reports" }],
    });
  }

  return insights;
}

/**
 * Tarjetas ILUSTRATIVAS de tipo SEO/página, solo para modo demo. Requieren datos
 * que Línea App todavía no registra (analítica por página, Search Console) — ver
 * plan de integración pendiente en el README. Se muestran siempre con una etiqueta
 * "Ejemplo ilustrativo" para no aparentar ser datos reales del negocio.
 */
export function getDemoSeoInsights(): OpportunityInsight[] {
  return [
    {
      id: "demo-seo-implantes",
      priority: "oportunidad",
      title: 'La página "Implantes dentales" convierte poco',
      explanation:
        "Recibe bastantes visitas pero solo un 0,8% termina contactando (ejemplo ilustrativo: requiere analítica por página, todavía no disponible).",
      recommendation: "Reforzar el CTA, añadir prueba social (reseñas, casos) y simplificar el formulario.",
      impact: "Ejemplo ilustrativo de cuánto puede pesar una sola página cuando se mide el detalle.",
      illustrative: true,
      actions: [{ label: "Editar página", href: "/dashboard/website/edit" }],
    },
    {
      id: "demo-seo-urgencias",
      priority: "oportunidad",
      title: "Oportunidad SEO: urgencias dentales",
      explanation:
        '312 personas buscaron "dentista urgencias Málaga" pero la web no tiene una página específica para ese servicio (ejemplo ilustrativo: requiere Google Search Console, todavía no conectado).',
      recommendation: "Crear una página dedicada a urgencias dentales.",
      impact: "Ejemplo ilustrativo de cómo una búsqueda frecuente sin página propia es negocio que se pierde.",
      illustrative: true,
      actions: [{ label: "Editar página", href: "/dashboard/website/edit" }],
    },
  ];
}
