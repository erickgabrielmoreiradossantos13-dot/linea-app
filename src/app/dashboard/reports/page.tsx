import type { Metadata } from "next";
import { FileBarChart2 } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getDashboardMetrics } from "@/lib/dashboard";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatPercent, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Informes · Línea App",
};

export const dynamic = "force-dynamic";

function Row({ label, current, previous }: { label: string; current: string; previous: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 py-3 last:border-0">
      <span className="text-sm text-ink-600">{label}</span>
      <div className="flex items-center gap-6 text-sm">
        <span className="font-medium text-ink-900">{current}</span>
        <span className="text-ink-400">antes: {previous}</span>
      </div>
    </div>
  );
}

export default async function ReportsPage() {
  const { business } = await getCurrentBusiness();
  const metrics = await getDashboardMetrics(business.id, business.linea_score);

  const today = formatDate(new Date().toISOString());

  return (
    <div>
      <PageHeader
        title="Informes"
        description={`Resumen de los últimos 30 días frente a los 30 anteriores · generado el ${today}.`}
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Resumen mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <Row
            label="Oportunidades generadas"
            current={formatNumber(metrics.opportunities)}
            previous={formatNumber(metrics.previousOpportunities)}
          />
          <Row
            label="Visitas a tu web"
            current={formatNumber(metrics.visitors)}
            previous={formatNumber(metrics.previousVisitors)}
          />
          <Row
            label="Conversión"
            current={formatPercent(metrics.conversionRate)}
            previous={formatPercent(metrics.previousConversionRate)}
          />

          <div className="mt-5 flex items-start gap-3 rounded-lg bg-ink-50/60 px-4 py-3">
            <FileBarChart2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
            <p className="text-xs leading-relaxed text-ink-500">
              Pronto podrás descargar este informe en PDF automáticamente cada mes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
