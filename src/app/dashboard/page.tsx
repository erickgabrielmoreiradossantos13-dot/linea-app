import type { Metadata } from "next";
import { Users, Target, TrendingUp, Wallet } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getDashboardMetrics } from "@/lib/dashboard";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { OpportunitiesChart } from "@/components/dashboard/opportunities-chart";
import { ChannelBreakdown } from "@/components/dashboard/channel-breakdown";
import { TrafficSources } from "@/components/dashboard/traffic-sources";
import { LineaScore } from "@/components/dashboard/linea-score";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard · Línea App",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { business } = await getCurrentBusiness();
  const metrics = await getDashboardMetrics(business.id, business.linea_score);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen de la actividad de tu negocio en los últimos 30 días."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Visitantes"
          value={formatNumber(metrics.visitors)}
          icon={Users}
          hint="Últimos 30 días"
          accent="brand"
        />
        <StatCard
          label="Oportunidades"
          value={formatNumber(metrics.opportunities)}
          icon={Target}
          hint="Leads generados"
          accent="violet"
        />
        <StatCard
          label="Conversión"
          value={formatPercent(metrics.conversionRate)}
          icon={TrendingUp}
          hint="Visitantes → oportunidades"
          accent="emerald"
        />
        <StatCard
          label="Valor potencial"
          value={formatCurrency(metrics.potentialValue)}
          icon={Wallet}
          hint="Oportunidades abiertas"
          accent="amber"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Oportunidades · últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent>
            <OpportunitiesChart data={metrics.opportunitiesTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Línea Score</CardTitle>
          </CardHeader>
          <CardContent>
            <LineaScore score={metrics.lineaScore} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Oportunidades por canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChannelBreakdown data={metrics.leadsBySource} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuentes de tráfico</CardTitle>
          </CardHeader>
          <CardContent>
            <TrafficSources data={metrics.trafficSources} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
