import type { Metadata } from "next";
import { FileBarChart2 } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getDashboardMetrics } from "@/lib/dashboard";
import { getLeads, getLeadAttribution } from "@/lib/leads";
import { getGoogleVisibility } from "@/lib/google";
import { getImprovementPlan } from "@/lib/plan";
import { getOpportunityInsights } from "@/lib/insights";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/components/reports/print-button";
import { formatNumber, formatPercent, formatDate, formatCurrency } from "@/lib/utils";

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
  const [metrics, leads, googleVisibility, planItems] = await Promise.all([
    getDashboardMetrics(business.id, business.linea_score),
    getLeads(business.id),
    getGoogleVisibility(),
    getImprovementPlan(business.id),
  ]);

  const insights = getOpportunityInsights(metrics, leads).slice(0, 3);
  const attribution = getLeadAttribution(leads);
  const completedThisPeriod = planItems.filter((i) => i.status === "completado").slice(0, 5);
  const nextActions = planItems
    .filter((i) => i.status === "planificado" || i.status === "recomendado")
    .slice(0, 5);

  const today = formatDate(new Date().toISOString());

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <PageHeader
          title="Informes"
          description={`Resumen de los últimos 30 días frente a los 30 anteriores · generado el ${today}.`}
        />
        <PrintButton />
      </div>

      <div className="hidden print:block print:mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Informe mensual · {business.name}</h1>
        <p className="text-sm text-ink-500">Generado el {today}</p>
      </div>

      <div className="space-y-4 print:space-y-6">
        <Card className="max-w-2xl print:max-w-none print:border-0 print:shadow-none">
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
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
            <Row
              label="Valor comercial potencial"
              current={formatCurrency(metrics.potentialValue)}
              previous="—"
            />
          </CardContent>
        </Card>

        <Card className="print:border-0 print:shadow-none">
          <CardHeader>
            <CardTitle>Oportunidades a destacar</CardTitle>
          </CardHeader>
          <CardContent>
            {insights.length > 0 ? (
              <ul className="space-y-3">
                {insights.map((insight) => (
                  <li key={insight.id} className="border-b border-ink-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-ink-900">{insight.title}</p>
                    <p className="mt-0.5 text-sm text-ink-500">{insight.explanation}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-400">No hay oportunidades destacadas este periodo.</p>
            )}
          </CardContent>
        </Card>

        <Card className="print:border-0 print:shadow-none">
          <CardHeader>
            <CardTitle>Páginas que mejor funcionaron</CardTitle>
          </CardHeader>
          <CardContent>
            {attribution.byLandingPage.length > 0 ? (
              <ul className="space-y-2">
                {attribution.byLandingPage.slice(0, 5).map((page) => (
                  <li key={page.label} className="flex items-center justify-between text-sm">
                    <span className="text-ink-700">{page.label}</span>
                    <span className="font-medium text-ink-900">{formatNumber(page.count)} contactos</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-400">Todavía no hay suficientes datos de página de origen.</p>
            )}
          </CardContent>
        </Card>

        <Card className="print:border-0 print:shadow-none">
          <CardHeader>
            <CardTitle>Google / SEO</CardTitle>
          </CardHeader>
          <CardContent>
            {googleVisibility.connected ? (
              <div className="space-y-1 text-sm text-ink-700">
                <p>{formatNumber(googleVisibility.impressions)} apariciones en búsquedas de Google.</p>
                <p>{formatNumber(googleVisibility.clicksFromGoogle)} visitas llegaron desde Google.</p>
              </div>
            ) : (
              <p className="text-sm text-ink-400">
                Google Search Console todavía no está conectado para este negocio.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 print:grid-cols-2">
          <Card className="print:border-0 print:shadow-none">
            <CardHeader>
              <CardTitle>Mejoras realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              {completedThisPeriod.length > 0 ? (
                <ul className="space-y-2 text-sm text-ink-700">
                  {completedThisPeriod.map((item) => (
                    <li key={item.id}>✓ {item.title}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-400">Todavía no hay mejoras completadas.</p>
              )}
            </CardContent>
          </Card>

          <Card className="print:border-0 print:shadow-none">
            <CardHeader>
              <CardTitle>Próximas acciones</CardTitle>
            </CardHeader>
            <CardContent>
              {nextActions.length > 0 ? (
                <ul className="space-y-2 text-sm text-ink-700">
                  {nextActions.map((item) => (
                    <li key={item.id}>○ {item.title}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-400">No hay acciones planificadas ahora mismo.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-ink-50/60 px-4 py-3 print:hidden">
          <FileBarChart2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
          <p className="text-xs leading-relaxed text-ink-500">
            Usa &ldquo;Imprimir / Guardar como PDF&rdquo; para guardar este informe. La generación
            automática mensual todavía no está disponible.
          </p>
        </div>
      </div>
    </div>
  );
}
