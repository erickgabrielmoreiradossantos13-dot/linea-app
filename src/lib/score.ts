import { getGoogleVisibility, getSeoLocalChecklist, type GoogleVisibility } from "@/lib/google";
import { getSiteForBusiness, getSiteContent } from "@/lib/site";
import { getLeads } from "@/lib/leads";
import {
  computeLineaScore,
  scoreConversion,
  scoreOpportunities,
  scoreSeo,
  scoreVisibility,
  scoreWebsite,
  type LineaScoreResult,
} from "@/lib/scoring";
import type { Lead } from "@/lib/types";

export type { LineaScoreResult, ScoreBreakdown } from "@/lib/scoring";

export interface LineaScoreDeps {
  /** Si el caller ya cargó leads/visibilidad de Google, se reutilizan en vez de repetir la petición. */
  leads?: Lead[];
  visibility?: GoogleVisibility;
}

/** Orquesta la obtención de datos (server-only) y delega el cálculo puro a `@/lib/scoring`. */
export async function getLineaScore(
  businessId: string,
  conversionRate: number,
  deps: LineaScoreDeps = {}
): Promise<LineaScoreResult> {
  const [visibility, site, leads] = await Promise.all([
    deps.visibility ?? getGoogleVisibility(),
    getSiteForBusiness(businessId),
    deps.leads ?? getLeads(businessId),
  ]);
  const content = site ? await getSiteContent(site.id) : null;

  return computeLineaScore({
    visibility: scoreVisibility(visibility),
    conversion: scoreConversion(conversionRate),
    seo: scoreSeo(getSeoLocalChecklist(content)),
    website: scoreWebsite(content),
    opportunities: scoreOpportunities(leads),
  });
}
