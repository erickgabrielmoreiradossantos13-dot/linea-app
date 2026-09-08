import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, List, Search } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getLeads, getLeadAttribution } from "@/lib/leads";
import { PageHeader } from "@/components/dashboard/page-header";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadsKanban } from "@/components/leads/leads-kanban";
import { CreateLeadModal } from "@/components/leads/create-lead-modal";
import { AttributionPanel } from "@/components/leads/attribution-panel";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/types";
import type { LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contactos · Línea App",
};

export const dynamic = "force-dynamic";

function FilterPill({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150",
        active ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
      )}
    >
      {label}
      <span className={cn("text-xs", active ? "text-white/70" : "text-ink-400")}>{count}</span>
    </Link>
  );
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; view?: string }>;
}) {
  const { status: rawStatus, q: rawQuery, view: rawView } = await searchParams;
  const status = LEAD_STATUSES.includes(rawStatus as LeadStatus) ? (rawStatus as LeadStatus) : undefined;
  const query = (rawQuery ?? "").trim().toLowerCase();
  const view = rawView === "kanban" ? "kanban" : "list";

  const { business } = await getCurrentBusiness();
  const allLeads = await getLeads(business.id);
  const attribution = getLeadAttribution(allLeads);

  const searchParamsBase = new URLSearchParams();
  if (status) searchParamsBase.set("status", status);
  if (rawQuery) searchParamsBase.set("q", rawQuery);

  const buildViewHref = (v: "list" | "kanban") => {
    const params = new URLSearchParams(searchParamsBase);
    params.set("view", v);
    return `/dashboard/leads?${params.toString()}`;
  };

  let leads = status ? allLeads.filter((l) => l.status === status) : allLeads;
  if (query) {
    leads = leads.filter((l) =>
      [l.name, l.phone, l.email, l.service].filter(Boolean).some((field) => field!.toLowerCase().includes(query))
    );
  }

  return (
    <div>
      <PageHeader
        title="Contactos"
        description={`${allLeads.length} contactos recibidos por ${business.name}.`}
        actions={<CreateLeadModal />}
      />

      <form className="relative mb-4 max-w-xs" action="/dashboard/leads">
        {status && <input type="hidden" name="status" value={status} />}
        <input type="hidden" name="view" value={view} />
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          name="q"
          defaultValue={rawQuery ?? ""}
          placeholder="Buscar por nombre, teléfono, email…"
          className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-900 outline-none transition-all duration-150 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
      </form>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterPill href="/dashboard/leads" label="Todos" count={allLeads.length} active={!status} />
          {LEAD_STATUSES.map((s) => (
            <FilterPill
              key={s}
              href={`/dashboard/leads?status=${s}${view === "kanban" ? "&view=kanban" : ""}`}
              label={LEAD_STATUS_LABELS[s]}
              count={allLeads.filter((l) => l.status === s).length}
              active={status === s}
            />
          ))}
        </div>

        <div className="inline-flex rounded-lg border border-ink-200 bg-white p-1">
          <Link
            href={buildViewHref("list")}
            className={cn(
              "flex h-7 w-8 items-center justify-center rounded-md",
              view === "list" ? "bg-ink-900 text-white" : "text-ink-400 hover:text-ink-900"
            )}
            aria-label="Vista de lista"
          >
            <List className="h-4 w-4" />
          </Link>
          <Link
            href={buildViewHref("kanban")}
            className={cn(
              "flex h-7 w-8 items-center justify-center rounded-md",
              view === "kanban" ? "bg-ink-900 text-white" : "text-ink-400 hover:text-ink-900"
            )}
            aria-label="Vista Kanban"
          >
            <LayoutGrid className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {view === "kanban" ? <LeadsKanban leads={leads} /> : <LeadsTable leads={leads} />}

      {allLeads.length > 0 && (
        <div className="mt-6">
          <AttributionPanel bySource={attribution.bySource} byLandingPage={attribution.byLandingPage} />
        </div>
      )}
    </div>
  );
}
