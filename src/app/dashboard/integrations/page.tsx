import type { Metadata } from "next";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getIntegrationSettings } from "@/lib/integrations";
import { getSiteForBusiness } from "@/lib/site";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationsForm } from "@/components/integrations/integrations-form";
import { TrackingSnippet } from "@/components/integrations/tracking-snippet";

export const metadata: Metadata = {
  title: "Integraciones · Línea App",
};

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const { business } = await getCurrentBusiness();
  const [settings, site] = await Promise.all([
    getIntegrationSettings(business.id),
    getSiteForBusiness(business.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Integraciones"
        description="Conecta las herramientas de medición y publicidad de tu negocio."
      />

      <Card>
        <CardHeader>
          <CardTitle>Analítica y anuncios</CardTitle>
        </CardHeader>
        <CardContent>
          <IntegrationsForm settings={settings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instalar el seguimiento en tu web</CardTitle>
        </CardHeader>
        <CardContent>
          <TrackingSnippet siteId={site?.id ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
