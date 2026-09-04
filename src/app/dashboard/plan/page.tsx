import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getImprovementPlan } from "@/lib/plan";
import { PageHeader } from "@/components/dashboard/page-header";
import { PlanChecklist } from "@/components/dashboard/plan-checklist";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Plan de mejora · Línea App",
};

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const { business } = await getCurrentBusiness();
  const items = await getImprovementPlan(business.id);

  return (
    <div>
      <PageHeader
        title="Plan de mejora"
        description="Esto es lo que el equipo de Línea Sur está trabajando en tu presencia digital."
      />

      {items.length > 0 ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Este mes estamos trabajando en:</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanChecklist items={items} nextReviewDate={business.next_review_date} />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={ListChecks}
          title="Todavía no hay un plan de mejora activo"
          description="Tu gestor de Línea Sur publicará aquí las tareas en las que está trabajando para tu negocio."
        />
      )}
    </div>
  );
}
