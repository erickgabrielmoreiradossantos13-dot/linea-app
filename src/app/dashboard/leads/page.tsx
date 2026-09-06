import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getLeads, getLeadAttribution } from "@/lib/leads";
import { PageHeader } from "@/components/dashboard/page-header";
import { LeadsTable } from "@/components/leads/leads-table";
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
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const status = LEAD_STATUSES.includes(rawStatus as LeadStatus) ? (rawStatus as LeadStatus) : undefined;

  const { business } = await getCurrentBusiness();
  const allLeads = await getLeads(business.id);
  const leads = status ? allLeads.filter((l) => l.status === status) : allLeads;
  const attribution = getLeadAttribution(allLeads);

  return (
    <div>
      <PageHeader
        title="Contactos"
        description={`${allLeads.length} contactos recibidos por ${business.name}.`}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterPill href="/dashboard/leads" label="Todos" count={allLeads.length} active={!status} />
        {LEAD_STATUSES.map((s) => (
          <FilterPill
            key={s}
            href={`/dashboard/leads?status=${s}`}
            label={LEAD_STATUS_LABELS[s]}
            count={allLeads.filter((l) => l.status === s).length}
            active={status === s}
          />
        ))}
      </div>

      <LeadsTable leads={leads} />

      {allLeads.length > 0 && (
        <div className="mt-6">
          <AttributionPanel bySource={attribution.bySource} byLandingPage={attribution.byLandingPage} />
        </div>
      )}
    </div>
  );
}
