import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Pencil, ExternalLink, Eye } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getSiteForBusiness } from "@/lib/site";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

const BUTTON_PRIMARY =
  "inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-ink-800 active:scale-[0.97]";
const BUTTON_SECONDARY =
  "inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 shadow-sm transition-all duration-150 hover:bg-ink-50 active:scale-[0.97]";
const BUTTON_OUTLINE =
  "inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-transparent px-4 py-2.5 text-sm font-medium text-ink-700 transition-all duration-150 hover:bg-ink-50 active:scale-[0.97]";

export const metadata: Metadata = {
  title: "Web · Línea App",
};

export const dynamic = "force-dynamic";

export default async function WebsitePage() {
  const { business } = await getCurrentBusiness();
  const site = await getSiteForBusiness(business.id);

  return (
    <div>
      <PageHeader title="Web" description="Tu sitio conectado a Línea App." />

      {!site ? (
        <EmptyState
          icon={Globe}
          title="Todavía no tienes una web conectada"
          description="Contacta con tu gestor de Línea Sur para conectar tu sitio y decidir qué partes vas a poder editar."
        />
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink-900">{site.name}</h2>
                {site.domain && <p className="text-sm text-ink-500">{site.domain}</p>}
              </div>
              <span
                className={
                  site.status === "published"
                    ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                    : "inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-500"
                }
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    site.status === "published" ? "bg-emerald-500" : "bg-ink-400"
                  }`}
                />
                {site.status === "published" ? "Publicado" : "Borrador"}
              </span>
            </div>

            {site.last_published_at && (
              <p className="mt-3 text-sm text-ink-400">
                Última actualización: {formatDate(site.last_published_at)}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard/website/edit" className={BUTTON_PRIMARY}>
                <Pencil className="h-4 w-4" /> Editar web
              </Link>

              {site.production_url && (
                <a
                  href={site.production_url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(BUTTON_SECONDARY)}
                >
                  <ExternalLink className="h-4 w-4" /> Ver web
                </a>
              )}

              <Link href="/dashboard/website/edit" className={BUTTON_OUTLINE}>
                <Eye className="h-4 w-4" /> Vista previa
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
