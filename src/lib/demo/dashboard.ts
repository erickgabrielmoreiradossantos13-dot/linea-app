import type { LeadSource, LeadStatus, TrafficSource } from "@/lib/types";
import type { DashboardMetrics } from "@/lib/dashboard";
import { computeDelta } from "@/lib/dashboard";
import {
  DEMO_BUSINESS,
  DEMO_PREVIOUS_TOTAL_LEADS,
  DEMO_PREVIOUS_TOTAL_VISITORS,
  DEMO_TOTAL_VISITORS,
  generateDemoLeads,
  getDemoTrafficCounts,
} from "@/lib/demo/data";
import { getDemoLeadOverrides } from "@/lib/demo/store";

export async function getDemoDashboardMetrics(): Promise<DashboardMetrics> {
  const overrides = await getDemoLeadOverrides();
  const leads = generateDemoLeads().map((lead) =>
    overrides[lead.id] ? { ...lead, status: overrides[lead.id] as LeadStatus } : lead
  );

  const visitors = DEMO_TOTAL_VISITORS;
  const trafficCounts = getDemoTrafficCounts();
  const trafficSources = (Object.keys(trafficCounts) as TrafficSource[])
    .map((source) => ({
      source,
      count: trafficCounts[source],
      percentage: visitors > 0 ? trafficCounts[source] / visitors : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const opportunities = leads.length;
  const conversionRate = visitors > 0 ? opportunities / visitors : 0;
  const previousConversionRate =
    DEMO_PREVIOUS_TOTAL_VISITORS > 0 ? DEMO_PREVIOUS_TOTAL_LEADS / DEMO_PREVIOUS_TOTAL_VISITORS : 0;

  const leadsBySource: Record<LeadSource, number> = { whatsapp: 0, formulario: 0, llamada: 0 };
  let potentialValue = 0;
  const trendMap = new Map<string, number>();

  for (const lead of leads) {
    leadsBySource[lead.source] = (leadsBySource[lead.source] ?? 0) + 1;

    if (lead.status !== "ganado" && lead.status !== "perdido") {
      potentialValue += lead.value_estimate;
    }

    const day = lead.created_at.slice(0, 10);
    trendMap.set(day, (trendMap.get(day) ?? 0) + 1);
  }

  const opportunitiesTrend: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    opportunitiesTrend.push({ date: key, count: trendMap.get(key) ?? 0 });
  }

  return {
    visitors,
    visitorsDelta: computeDelta(visitors, DEMO_PREVIOUS_TOTAL_VISITORS),
    previousVisitors: DEMO_PREVIOUS_TOTAL_VISITORS,
    opportunities,
    opportunitiesDelta: computeDelta(opportunities, DEMO_PREVIOUS_TOTAL_LEADS),
    previousOpportunities: DEMO_PREVIOUS_TOTAL_LEADS,
    conversionRate,
    conversionDelta: computeDelta(conversionRate, previousConversionRate),
    previousConversionRate,
    potentialValue,
    leadsBySource,
    trafficSources,
    opportunitiesTrend,
    lineaScore: DEMO_BUSINESS.linea_score,
  };
}
