import type { Metadata } from "next";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Configuración · Línea App",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { business } = await getCurrentBusiness();

  return (
    <div>
      <PageHeader title="Configuración" description="Datos de tu negocio en Línea App." />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tu negocio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Nombre</span>
              <span className="font-medium text-ink-900">{business.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Ciudad</span>
              <span className="font-medium text-ink-900">{business.city ?? "—"}</span>
            </div>
            <p className="pt-2 text-xs text-ink-400">
              ¿Necesitas cambiar estos datos? Contacta con tu gestor de Línea Sur.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valor comercial potencial</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsForm
              businessId={business.id}
              avgClientValue={business.avg_client_value}
              closeRate={business.close_rate}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
