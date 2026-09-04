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
          value={metrics.visitors}
          formatType="number"
          icon={<Users className="h-4 w-4" strokeWidth={2} />}
          hint="Últimos 30 días"
          accent="brand"
          delay={0}
        />
        <StatCard
          label="Oportunidades"
          value={metrics.opportunities}
          formatType="number"
          icon={<Target className="h-4 w-4" strokeWidth={2} />}
          hint="Leads generados"
          accent="violet"
          delay={60}
        />
        <StatCard
          label="Conversión"
          value={metrics.conversionRate}
          formatType="percent"
          icon={<TrendingUp className="h-4 w-4" strokeWidth={2} />}
          hint="Visitantes → oportunidades"
          accent="emerald"
          delay={120}
        />
        <StatCard
          label="Valor potencial"
          value={metrics.potentialValue}
          formatType="currency"
          icon={<Wallet className="h-4 w-4" strokeWidth={2} />}
          hint="Oportunidades abiertas"
          accent="amber"
          delay={180}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          className="animate-fade-in-up xl:col-span-2"
          style={{ animationDelay: "220ms" }}
        >
          <CardHeader>
            <CardTitle>Oportunidades · últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent>
            <OpportunitiesChart data={metrics.opportunitiesTrend} />
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: "260ms" }}>
          <CardHeader>
            <CardTitle>Línea Score</CardTitle>
          </CardHeader>
          <CardContent>
            <LineaScore score={metrics.lineaScore} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          className="animate-fade-in-up xl:col-span-2"
          style={{ animationDelay: "300ms" }}
        >
          <CardHeader>
            <CardTitle>Oportunidades por canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChannelBreakdown data={metrics.leadsBySource} />
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: "340ms" }}>
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
