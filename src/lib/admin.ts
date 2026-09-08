import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { DEMO_BUSINESS } from "@/lib/demo/data";
import * as demoSite from "@/lib/demo/site";
import { getDashboardMetrics } from "@/lib/dashboard";
import { getLeads } from "@/lib/leads";
import { getLineaScore } from "@/lib/score";
import { STALE_DAYS } from "@/lib/insights";
import type { Business, Site } from "@/lib/types";

export interface SiteWithBusiness extends Site {
  business_name: string;
}

export async function getAllSitesForStaff(): Promise<SiteWithBusiness[]> {
  if (IS_DEMO_MODE) {
    const site = await demoSite.adapter.getSiteForBusiness(DEMO_BUSINESS.id);
    return site ? [{ ...site, business_name: DEMO_BUSINESS.name }] : [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("*, business:businesses(name)")
    .order("created_at", { ascending: false });

  return ((data ?? []) as (Site & { business: { name: string } | null })[]).map((row) => ({
    ...row,
    business_name: row.business?.name ?? "—",
  }));
}

export async function getAllBusinessesForStaff(): Promise<Business[]> {
  if (IS_DEMO_MODE) return [DEMO_BUSINESS];

  const supabase = await createClient();
  const { data } = await supabase.from("businesses").select("*").order("name", { ascending: true });
  return (data as Business[]) ?? [];
}

export type SiteHealth = "creciendo" | "estable" | "necesita_intervencion";

export interface AdminClientRow {
  business: Business;
  site: Site | null;
  visits: number;
  leads: number;
  staleLeads: number;
  conversionRate: number;
  lineaScore: number;
  health: SiteHealth;
}

export interface AdminOverview {
  rows: AdminClientRow[];
  totals: {
    activeClients: number;
    publishedSites: number;
    totalLeads: number;
    needAttention: number;
    averageScore: number;
  };
}

/**
 * Centro operativo de Línea Sur (Fase 4): una fila por cliente con sus
 * métricas de los últimos 30 días. Reutiliza exactamente las mismas
 * funciones que ve el cliente en su propio dashboard (getDashboardMetrics,
 * getLineaScore) — el staff ve la misma verdad, no un cálculo aparte.
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  const [businesses, sites] = await Promise.all([getAllBusinessesForStaff(), getAllSitesForStaff()]);
  const staleCutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;

  const rows = await Promise.all(
    businesses.map(async (business): Promise<AdminClientRow> => {
      const site = sites.find((s) => s.business_id === business.id) ?? null;
      const [metrics, leads] = await Promise.all([getDashboardMetrics(business.id), getLeads(business.id)]);
      const staleLeads = leads.filter(
        (lead) => lead.status === "nuevo" && new Date(lead.created_at).getTime() < staleCutoff
      ).length;
      const score = await getLineaScore(business.id, metrics.conversionRate, { leads });

      const health: SiteHealth =
        score.total < 50 || metrics.opportunitiesDelta.direction === "down"
          ? "necesita_intervencion"
          : metrics.opportunitiesDelta.direction === "up"
            ? "creciendo"
            : "estable";

      return {
        business,
        site,
        visits: metrics.visitors,
        leads: metrics.opportunities,
        staleLeads,
        conversionRate: metrics.conversionRate,
        lineaScore: score.total,
        health,
      };
    })
  );

  const publishedSites = sites.filter((s) => s.status === "published").length;
  const needAttention = rows.filter((r) => r.health === "necesita_intervencion").length;
  const averageScore = rows.length > 0 ? Math.round(rows.reduce((sum, r) => sum + r.lineaScore, 0) / rows.length) : 0;

  return {
    rows,
    totals: {
      activeClients: businesses.length,
      publishedSites,
      totalLeads: rows.reduce((sum, r) => sum + r.leads, 0),
      needAttention,
      averageScore,
    },
  };
}
