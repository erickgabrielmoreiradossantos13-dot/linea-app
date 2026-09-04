import type { Metadata } from "next";
import Link from "next/link";
import { Target, Users, TrendingUp, Search as SearchIcon, ArrowRight } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getDashboardMetrics } from "@/lib/dashboard";
import { getLeads } from "@/lib/leads";
import { getGoogleVisibility } from "@/lib/google";
import { getOpportunityInsights, getDemoSeoInsights } from "@/lib/insights";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { OpportunitiesChart } from "@/components/dashboard/opportunities-chart";
import { ChannelBreakdown } from "@/components/dashboard/channel-breakdown";
import { TrafficSources } from "@/components/dashboard/traffic-sources";
import { LineaScore } from "@/components/dashboard/linea-score";
import { OpportunityCard } from "@/components/dashboard/opportunity-card";
import { CommercialValueCard } from "@/components/dashboard/commercial-value-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Inicio · Línea App",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { business } = await getCurrentBusiness();
  const [metrics, leads, googleVisibility] = await Promise.all([
    getDashboardMetrics(business.id, business.linea_score),
    getLeads(business.id),
    getGoogleVisibility(),
  ]);

  const insights = [
    ...getOpportunityInsights(metrics, leads),
    ...(IS_DEMO_MODE ? getDemoSeoInsights() : []),
  ];
  const featuredInsights = insights.slice(0, 2);

  return (
    <div>
      <GreetingHeader
        businessName={business.name}
        opportunities={metrics.opportunities}
        opportunitiesDelta={metrics.opportunitiesDelta}
      />

      {/* 1. Resultados comerciales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Oportunidades"
          value={metrics.opportunities}
          formatType="number"
          icon={<Target className="h-4 w-4" strokeWidth={2} />}
          accent="violet"
          delta={metrics.opportunitiesDelta}
          delay={0}
        />
        <StatCard
          label="Visitas"
          value={metrics.visitors}
          formatType="number"
          icon={<Users className="h-4 w-4" strokeWidth={2} />}
          accent="sky"
          delta={metrics.visitorsDelta}
          delay={60}
        />
        <StatCard
          label="Conversión"
          value={metrics.conversionRate}
          formatType="percent"
          icon={<TrendingUp className="h-4 w-4" strokeWidth={2} />}
          accent="emerald"
          delta={metrics.conversionDelta}
          delay={120}
        />
        {googleVisibility.connected ? (
          <StatCard
            label="Visibilidad en Google"
            value={googleVisibility.impressions}
            formatType="number"
            icon={<SearchIcon className="h-4 w-4" strokeWidth={2} />}
            accent="orange"
            hint="Veces que apareciste en búsquedas"
            delta={{
              percent: googleVisibility.impressionsDelta,
              direction: googleVisibility.impressionsDelta >= 0 ? "up" : "down",
            }}
            delay={180}
          />
        ) : (
          <StatCard
            label="Visibilidad en Google"
            value={0}
            formatType="number"
            icon={<SearchIcon className="h-4 w-4" strokeWidth={2} />}
            accent="orange"
            notConnected
            notConnectedLabel="Conecta Google en la sección Google"
            delay={180}
          />
        )}
      </div>

      {/* 2. Oportunidades destacadas */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-ink-900">Oportunidades destacadas</h2>
          <Link
            href="/dashboard/opportunities"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {featuredInsights.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {featuredInsights.map((insight) => (
              <OpportunityCard key={insight.id} insight={insight} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Target}
            title="Aún no tenemos suficientes datos para mostrar oportunidades"
            description="Cuando tengas más actividad en tu web y tus contactos, aquí aparecerán recomendaciones automáticas."
          />
        )}
      </div>

      {/* 3. Evolución */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="animate-fade-in-up xl:col-span-2" style={{ animationDelay: "220ms" }}>
          <CardHeader>
            <CardTitle>Oportunidades · últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent>
            <OpportunitiesChart data={metrics.opportunitiesTrend} />
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: "260ms" }}>
          <CardHeader>
            <CardTitle>Cómo llegan tus clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <TrafficSources data={metrics.trafficSources} />
            <p className="mt-4 text-xs leading-relaxed text-ink-400">
              Basado en las visitas a tu web. Todavía no vinculamos cada contacto con la fuente
              que lo trajo.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <CardTitle>Acciones comerciales</CardTitle>
          </CardHeader>
          <CardContent>
            <ChannelBreakdown data={metrics.leadsBySource} />
          </CardContent>
        </Card>
      </div>

      {/* 4-5. Recomendaciones / datos de control */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="animate-fade-in-up" style={{ animationDelay: "340ms" }}>
          <CardHeader>
            <CardTitle>Valor comercial potencial</CardTitle>
          </CardHeader>
          <CardContent>
            <CommercialValueCard
              opportunities={metrics.opportunities}
              avgClientValue={business.avg_client_value}
              closeRate={business.close_rate}
            />
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: "380ms" }}>
          <CardHeader>
            <CardTitle>Línea Score</CardTitle>
          </CardHeader>
          <CardContent>
            <LineaScore score={metrics.lineaScore} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
