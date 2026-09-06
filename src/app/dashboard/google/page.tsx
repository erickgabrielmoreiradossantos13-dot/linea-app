import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users, MousePointerClick, Sparkles } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getGoogleVisibility, getSeoLocalChecklist, getGeoAiChecklist } from "@/lib/google";
import { getSiteForBusiness, getSiteContent } from "@/lib/site";
import { getImprovementPlan } from "@/lib/plan";
import { PLAN_CATEGORY_LABELS } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Checklist } from "@/components/dashboard/checklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPercent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Google · Línea App",
};

export const dynamic = "force-dynamic";

const RELEVANT_CATEGORIES = new Set(["seo_local", "geo_ia", "google"]);

export default async function GooglePage() {
  const { business } = await getCurrentBusiness();
  const site = await getSiteForBusiness(business.id);
  const content = site ? await getSiteContent(site.id) : null;
  const [visibility, planItems] = await Promise.all([getGoogleVisibility(), getImprovementPlan(business.id)]);

  const nextActions = planItems
    .filter((item) => item.category && RELEVANT_CATEGORIES.has(item.category) && item.status !== "completado" && item.status !== "descartado")
    .slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Google"
        description="Cómo de visible es tu negocio en Google, y qué falta para mejorarlo."
      />

      <div className="space-y-5">
        <div>
          <h2 className="mb-3 text-[15px] font-semibold text-ink-900">Visibilidad en Google</h2>
          {!visibility.connected ? (
            <EmptyState
              icon={Search}
              title="Aún no has conectado Google"
              description="Conecta tu cuenta de Google Search Console para ver cuántas veces aparece tu negocio en las búsquedas y qué está trayendo visitas."
              action={<Button disabled>Conectar Google (próximamente)</Button>}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Search className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium text-ink-500">Visibilidad en Google</p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">
                      Tu negocio apareció {formatNumber(visibility.impressions)} veces en búsquedas.
                    </p>
                    <p className="mt-1 text-sm text-emerald-600">
                      +{Math.round(visibility.impressionsDelta * 100)}% respecto al mes pasado
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <MousePointerClick className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium text-ink-500">Visitas desde Google</p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">
                      {formatNumber(visibility.clicksFromGoogle)} personas visitaron tu web desde Google.
                    </p>
                    <p className="mt-1 text-sm text-ink-400">
                      {formatPercent(visibility.clicksFromGoogle / visibility.impressions)} de quienes te vieron, entraron
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Búsquedas que están trayendo visitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {visibility.topQueries.map((query) => (
                      <li
                        key={query}
                        className="flex items-center gap-2 rounded-lg bg-ink-50/60 px-3.5 py-2.5 text-sm text-ink-700"
                      >
                        <Users className="h-3.5 w-3.5 text-ink-400" />
                        &ldquo;{query}&rdquo;
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                Datos de ejemplo: la integración real con Google Search Console todavía no está
                conectada para este negocio.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>SEO local</CardTitle>
            </CardHeader>
            <CardContent>
              <Checklist items={getSeoLocalChecklist(content)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preparación para IA (GEO)</CardTitle>
            </CardHeader>
            <CardContent>
              <Checklist items={getGeoAiChecklist(content)} />
              <p className="mt-4 text-xs leading-relaxed text-ink-400">
                Estructuramos tu información para que buscadores tradicionales y sistemas de IA
                (ChatGPT, Gemini, Perplexity) entiendan mejor tu negocio. No garantiza apariciones
                concretas.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Próximas acciones</CardTitle>
          </CardHeader>
          <CardContent>
            {nextActions.length > 0 ? (
              <ul className="space-y-3">
                {nextActions.map((item) => (
                  <li key={item.id} className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" strokeWidth={2} />
                    <div>
                      <p className="text-sm font-medium text-ink-900">{item.title}</p>
                      {item.category && (
                        <p className="text-xs text-ink-400">{PLAN_CATEGORY_LABELS[item.category]}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-400">
                No hay acciones de Google o SEO planificadas ahora mismo.{" "}
                <Link href="/dashboard/support" className="font-medium text-brand-600 hover:text-brand-700">
                  Solicita una mejora →
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
