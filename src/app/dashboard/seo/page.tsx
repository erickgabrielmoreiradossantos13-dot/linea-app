import type { Metadata } from "next";
import { CheckCircle2, AlertTriangle, Link as LinkIcon } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getSiteForBusiness } from "@/lib/site";
import { getSeoAudit } from "@/lib/seo";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "SEO · Línea App",
};

export const dynamic = "force-dynamic";

const PRIORITY_STYLES = {
  alta: "bg-red-50 text-red-700",
  media: "bg-amber-50 text-amber-700",
  baja: "bg-ink-100 text-ink-500",
};

const PRIORITY_LABELS = { alta: "Alta prioridad", media: "Media", baja: "Baja" };

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export default async function SeoPage() {
  const { business } = await getCurrentBusiness();
  const site = await getSiteForBusiness(business.id);
  const audit = await getSeoAudit(site?.production_url ?? null);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="SEO"
        description="Análisis real de tu web publicada: qué está bien y qué deberías mejorar para aparecer en Google."
      />

      {!audit.analyzed ? (
        <EmptyState
          icon={audit.error === "not_connected" ? LinkIcon : AlertTriangle}
          title={
            audit.error === "not_connected"
              ? "Todavía no hay una web publicada para analizar"
              : "No hemos podido analizar tu web ahora mismo"
          }
          description={
            audit.error === "not_connected"
              ? "En cuanto tu sitio tenga una URL de producción configurada, este análisis se generará automáticamente."
              : `No hemos podido acceder a ${audit.url}. Puede que esté caída o bloqueando nuestras peticiones. Vuelve a intentarlo en unos minutos.`
          }
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm text-ink-500">Puntuación SEO de {audit.url}</p>
                <p className={cn("text-4xl font-semibold tracking-tight", scoreColor(audit.score))}>
                  {audit.score}
                  <span className="text-lg text-ink-300"> /100</span>
                </p>
              </div>
              <p className="max-w-sm text-sm text-ink-500">
                {audit.checks.filter((c) => c.passed).length} de {audit.checks.length} comprobaciones superadas.
                Basado en el HTML publicado ahora mismo, sin datos inventados.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {audit.checks
              .slice()
              .sort((a, b) => Number(a.passed) - Number(b.passed))
              .map((check) => (
                <Card key={check.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      {check.passed ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-ink-900">{check.label}</p>
                          {!check.passed && (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                PRIORITY_STYLES[check.priority]
                              )}
                            >
                              {PRIORITY_LABELS[check.priority]}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-ink-500">{check.problem}</p>
                        {!check.passed && (
                          <>
                            <p className="mt-2 text-sm text-ink-600">
                              <span className="font-medium">Impacto: </span>
                              {check.impact}
                            </p>
                            <p className="mt-1 text-sm text-ink-600">
                              <span className="font-medium">Qué hacer: </span>
                              {check.action}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
