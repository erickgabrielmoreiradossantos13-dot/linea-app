import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLineaStaff } from "@/lib/staff";
import { getAllSitesForStaff, getAllBusinessesForStaff } from "@/lib/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { AddSiteForm } from "./add-site-form";

export const metadata: Metadata = {
  title: "Administración de sitios · Línea App",
};

export const dynamic = "force-dynamic";

export default async function AdminSitesPage() {
  const staff = await isLineaStaff();
  if (!staff) {
    redirect("/dashboard");
  }

  const [sites, businesses] = await Promise.all([getAllSitesForStaff(), getAllBusinessesForStaff()]);

  return (
    <div>
      <PageHeader
        title="Sitios conectados"
        description="Solo visible para el equipo de Línea Sur. Añade un sitio y luego configura su contenido editable por SQL."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Añadir sitio</CardTitle>
          </CardHeader>
          <CardContent>
            <AddSiteForm businesses={businesses} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sitios existentes</CardTitle>
          </CardHeader>
          <CardContent>
            {sites.length === 0 ? (
              <p className="text-sm text-ink-400">Todavía no hay sitios conectados.</p>
            ) : (
              <ul className="space-y-3">
                {sites.map((site) => (
                  <li key={site.id} className="rounded-lg border border-ink-100 p-3.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink-900">{site.name}</p>
                      <span className="text-xs text-ink-400">{site.status}</span>
                    </div>
                    <p className="text-xs text-ink-500">{site.business_name}</p>
                    {site.domain && <p className="text-xs text-ink-400">{site.domain}</p>}
                    {site.last_published_at && (
                      <p className="mt-1 text-xs text-ink-400">
                        Última publicación: {formatDate(site.last_published_at)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
