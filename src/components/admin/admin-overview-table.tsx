"use client";

import { useMemo, useState } from "react";
import { Search, ExternalLink, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatNumber, formatPercent, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { viewAsBusinessAction } from "@/app/dashboard/admin/sites/actions";
import type { AdminClientRow, SiteHealth } from "@/lib/admin";

const HEALTH_META: Record<SiteHealth, { label: string; className: string }> = {
  creciendo: { label: "Creciendo", className: "bg-emerald-50 text-emerald-700" },
  estable: { label: "Estable", className: "bg-ink-100 text-ink-600" },
  necesita_intervencion: { label: "Necesita atención", className: "bg-red-50 text-red-700" },
};

export function AdminOverviewTable({ rows }: { rows: AdminClientRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.business.name.toLowerCase().includes(q) || row.site?.domain?.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <div>
      <div className="relative mb-3 max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cliente o dominio…"
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-100">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/50 text-xs font-medium uppercase tracking-wide text-ink-400">
              <th className="px-4 py-2.5">Cliente</th>
              <th className="px-4 py-2.5">Dominio</th>
              <th className="px-4 py-2.5 text-right">Visitas</th>
              <th className="px-4 py-2.5 text-right">Leads</th>
              <th className="px-4 py-2.5 text-right">Conversión</th>
              <th className="px-4 py-2.5 text-right">Línea Score</th>
              <th className="px-4 py-2.5">Estado</th>
              <th className="px-4 py-2.5">Última actualización</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const health = HEALTH_META[row.health];
              return (
                <tr key={row.business.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{row.business.name}</p>
                    {row.staleLeads > 0 && (
                      <p className="text-xs text-red-600">{row.staleLeads} sin gestionar</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{row.site?.domain ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-700">{formatNumber(row.visits)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-700">{formatNumber(row.leads)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-700">
                    {formatPercent(row.conversionRate)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-ink-900">{row.lineaScore}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", health.className)}>
                      {health.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-400">
                    {row.site?.last_published_at ? formatDate(row.site.last_published_at) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      {row.site?.production_url && (
                        <a
                          href={row.site.production_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                        >
                          Abrir web
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                      <form action={viewAsBusinessAction.bind(null, row.business.id)}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs font-medium text-ink-700 hover:text-ink-900 hover:underline"
                        >
                          Entrar
                          <LogIn className="size-3" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-ink-400">
                  Ningún cliente coincide con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
