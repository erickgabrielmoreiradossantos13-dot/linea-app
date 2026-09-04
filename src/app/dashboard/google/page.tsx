import type { Metadata } from "next";
import { Search, Users, MousePointerClick } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getGoogleVisibility } from "@/lib/google";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPercent } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Google · Línea App",
};

export const dynamic = "force-dynamic";

export default async function GooglePage() {
  await getCurrentBusiness();
  const visibility = await getGoogleVisibility();

  return (
    <div>
      <PageHeader
        title="Google"
        description="Cómo de visible es tu negocio en las búsquedas de Google."
      />

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
  );
}
