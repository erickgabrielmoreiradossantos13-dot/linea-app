import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getSupportRequests } from "@/lib/support";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportForm } from "@/components/support/support-form";
import { SupportRequestCard } from "@/components/support/support-request-card";

export const metadata: Metadata = {
  title: "Solicitudes · Línea App",
};

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const { business } = await getCurrentBusiness();
  const requests = await getSupportRequests(business.id);
  const open = requests.filter((r) => r.status !== "resuelta");
  const resolved = requests.filter((r) => r.status === "resuelta");

  return (
    <div>
      <PageHeader
        title="Solicitudes"
        description="Pide cambios, mejoras o ayuda directamente a tu equipo de Línea Sur."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {open.length === 0 && resolved.length === 0 ? (
            <EmptyState
              icon={LifeBuoy}
              title="Todavía no has enviado ninguna solicitud"
              description="Cuando necesites un cambio de contenido, una mejora o ayuda técnica, pídelo aquí y te responderemos en breve."
            />
          ) : (
            <>
              {open.length > 0 && (
                <div>
                  <h2 className="mb-3 text-[15px] font-semibold text-ink-900">Abiertas</h2>
                  <div className="space-y-3">
                    {open.map((request) => (
                      <SupportRequestCard key={request.id} request={request} />
                    ))}
                  </div>
                </div>
              )}
              {resolved.length > 0 && (
                <div>
                  <h2 className="mb-3 text-[15px] font-semibold text-ink-900">Resueltas</h2>
                  <div className="space-y-3">
                    {resolved.map((request) => (
                      <SupportRequestCard key={request.id} request={request} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Nueva solicitud</CardTitle>
          </CardHeader>
          <CardContent>
            <SupportForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
