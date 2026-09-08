"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ChevronRight, ChevronLeft, Phone, Mail } from "lucide-react";
import { updateLeadStatus } from "@/app/dashboard/leads/actions";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type Lead, type LeadStatus } from "@/lib/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const COLUMN_ACCENT: Record<LeadStatus, string> = {
  nuevo: "border-t-brand-400",
  contactado: "border-t-amber-400",
  negociacion: "border-t-violet-400",
  ganado: "border-t-emerald-400",
  perdido: "border-t-ink-300",
};

function LeadCard({ lead }: { lead: Lead }) {
  const [isPending, startTransition] = useTransition();
  const index = LEAD_STATUSES.indexOf(lead.status);

  function move(direction: -1 | 1) {
    const next = LEAD_STATUSES[index + direction];
    if (!next) return;
    startTransition(async () => {
      await updateLeadStatus(lead.id, next);
    });
  }

  return (
    <div
      className={cn(
        "group rounded-xl border border-ink-100 bg-white p-3.5 shadow-card transition-opacity duration-150",
        isPending && "opacity-50"
      )}
    >
      <Link href={`/dashboard/leads/${lead.id}`} className="text-sm font-semibold text-ink-900 hover:underline">
        {lead.name}
      </Link>
      <div className="mt-1.5 space-y-0.5 text-xs text-ink-500">
        {lead.phone && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" /> {lead.phone}
          </p>
        )}
        {lead.email && (
          <p className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" /> {lead.email}
          </p>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-ink-400">{formatDate(lead.created_at)}</span>
        <span className="font-medium text-ink-700">{formatCurrency(lead.value_estimate)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-2">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={index === 0 || isPending}
          aria-label="Mover a la etapa anterior"
          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-[11px] text-ink-400">{lead.service ?? "—"}</span>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={index === LEAD_STATUSES.length - 1 || isPending}
          aria-label="Mover a la siguiente etapa"
          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function LeadsKanban({ leads }: { leads: Lead[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5">
      {LEAD_STATUSES.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        return (
          <div key={status} className="min-w-[220px]">
            <div
              className={cn(
                "flex items-center justify-between rounded-t-lg border-t-[3px] bg-ink-50/60 px-3 py-2",
                COLUMN_ACCENT[status]
              )}
            >
              <span className="text-xs font-semibold text-ink-700">{LEAD_STATUS_LABELS[status]}</span>
              <span className="text-xs text-ink-400">{columnLeads.length}</span>
            </div>
            <div className="space-y-2 rounded-b-lg bg-ink-50/30 p-2">
              {columnLeads.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-ink-300">Sin contactos</p>
              ) : (
                columnLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
