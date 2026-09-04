import type { Metadata } from "next";
import { Target } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getDashboardMetrics } from "@/lib/dashboard";
import { getLeads } from "@/lib/leads";
import { getOpportunityInsights, getDemoSeoInsights } from "@/lib/insights";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { PageHeader } from "@/components/dashboard/page-header";
import { OpportunityCard } from "@/components/dashboard/opportunity-card";
import { EmptyState } from "@/components/dashboard/empty-state";

export const metadata: Metadata = {
  title: "Oportunidades · Línea App",
};

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const { business } = await getCurrentBusiness();
  const [metrics, leads] = await Promise.all([
    getDashboardMetrics(business.id, business.linea_score),
    getLeads(business.id),
  ]);

  const insights = [
    ...getOpportunityInsights(metrics, leads),
    ...(IS_DEMO_MODE ? getDemoSeoInsights() : []),
  ];

  return (
    <div>
      <PageHeader
        title="Oportunidades"
        description="Recomendaciones automáticas a partir de la actividad real de tu negocio."
      />

      {insights.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {insights.map((insight) => (
            <OpportunityCard key={insight.id} insight={insight} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="Aún no tenemos suficientes datos para mostrar oportunidades"
          description="Cuando tengas más actividad en tu web y tus contactos, aquí aparecerán recomendaciones automáticas sobre qué mejorar."
        />
      )}
    </div>
  );
}
