import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLineaStaff } from "@/lib/staff";
import { getAllSitesForStaff, getAllBusinessesForStaff, getAdminOverview } from "@/lib/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOverviewTable } from "@/components/admin/admin-overview-table";
import { formatDate, formatNumber } from "@/lib/utils";
import { AddSiteForm } from "./add-site-form";

export const metadata: Metadata = {
  title: "Administración · Línea App",
};

export const dynamic = "force-dynamic";

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      <p className="text-xs font-medium text-ink-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">{value}</p>
    </div>
  );
}

export default async function AdminSitesPage() {
  const staff = await isLineaStaff();
  if (!staff) {
    redirect("/dashboard");
  }

  const [sites, businesses, overview] = await Promise.all([
    getAllSitesForStaff(),
    getAllBusinessesForStaff(),
    getAdminOverview(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administración"
        description="Centro operativo de Línea Sur: cómo está cada cliente, ahora mismo."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile label="Clientes activos" value={formatNumber(overview.totals.activeClients)} />
        <KpiTile label="Webs publicadas" value={formatNumber(overview.totals.publishedSites)} />
        <KpiTile label="Leads (30 días)" value={formatNumber(overview.totals.totalLeads)} />
        <KpiTile label="Necesitan atención" value={formatNumber(overview.totals.needAttention)} />
        <KpiTile label="Línea Score medio" value={String(overview.totals.averageScore)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminOverviewTable rows={overview.rows} />
        </CardContent>
      </Card>

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
