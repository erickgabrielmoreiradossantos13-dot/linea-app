import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { getDemoDashboardMetrics } from "@/lib/demo/dashboard";
import type { LeadSource, TrafficSource } from "@/lib/types";

const TRAFFIC_SOURCES: TrafficSource[] = ["google", "instagram", "facebook", "directo", "referido"];

export interface DashboardMetrics {
  visitors: number;
  opportunities: number;
  conversionRate: number;
  potentialValue: number;
  leadsBySource: Record<LeadSource, number>;
  trafficSources: { source: TrafficSource; count: number; percentage: number }[];
  opportunitiesTrend: { date: string; count: number }[];
  lineaScore: number;
}

export async function getDashboardMetrics(
  businessId: string,
  lineaScore: number
): Promise<DashboardMetrics> {
  if (IS_DEMO_MODE) {
    return getDemoDashboardMetrics();
  }

  const supabase = await createClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffIso = cutoff.toISOString();

  const [visitorsTotalRes, ...trafficCountRes] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("occurred_at", cutoffIso),
    ...TRAFFIC_SOURCES.map((source) =>
      supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .eq("source", source)
        .gte("occurred_at", cutoffIso)
    ),
  ]);

  const visitors = visitorsTotalRes.count ?? 0;

  const trafficSources = TRAFFIC_SOURCES.map((source, index) => {
    const count = trafficCountRes[index].count ?? 0;
    return { source, count, percentage: visitors > 0 ? count / visitors : 0 };
  }).sort((a, b) => b.count - a.count);

  const { data: leadsRaw } = await supabase
    .from("leads")
    .select("id, source, status, value_estimate, created_at")
    .eq("business_id", businessId)
    .gte("created_at", cutoffIso)
    .order("created_at", { ascending: true })
    .limit(1000);

  const leads = leadsRaw ?? [];
  const opportunities = leads.length;
  const conversionRate = visitors > 0 ? opportunities / visitors : 0;

  const leadsBySource: Record<LeadSource, number> = {
    whatsapp: 0,
    formulario: 0,
    llamada: 0,
  };
  let potentialValue = 0;
  const trendMap = new Map<string, number>();

  for (const lead of leads) {
    const source = lead.source as LeadSource;
    leadsBySource[source] = (leadsBySource[source] ?? 0) + 1;

    if (lead.status !== "ganado" && lead.status !== "perdido") {
      potentialValue += Number(lead.value_estimate) || 0;
    }

    const day = String(lead.created_at).slice(0, 10);
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
    opportunities,
    conversionRate,
    potentialValue,
    leadsBySource,
    trafficSources,
    opportunitiesTrend,
    lineaScore,
  };
}
