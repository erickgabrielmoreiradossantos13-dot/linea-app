"use client";

import { useState, useTransition } from "react";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/types";
import { updateLeadStatus } from "@/app/dashboard/leads/actions";
import { cn } from "@/lib/utils";

interface StatusSelectProps {
  leadId: string;
  status: LeadStatus;
}

const STATUS_STYLES: Record<LeadStatus, string> = {
  nuevo: "bg-brand-50 text-brand-700 border-brand-200",
  contactado: "bg-amber-50 text-amber-700 border-amber-200",
  cita: "bg-violet-50 text-violet-700 border-violet-200",
  ganado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  perdido: "bg-ink-100 text-ink-500 border-ink-200",
};

export function StatusSelect({ leadId, status }: StatusSelectProps) {
  const [current, setCurrent] = useState<LeadStatus>(status);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: LeadStatus) {
    const previous = current;
    setCurrent(next);

    startTransition(async () => {
      try {
        await updateLeadStatus(leadId, next);
      } catch {
        setCurrent(previous);
      }
    });
  }

  return (
    <select
      value={current}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as LeadStatus)}
      className={cn(
        "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium outline-none transition-all duration-150 hover:brightness-95 focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-wait disabled:opacity-60",
        STATUS_STYLES[current]
      )}
    >
      {LEAD_STATUSES.map((option) => (
        <option key={option} value={option}>
          {LEAD_STATUS_LABELS[option]}
        </option>
      ))}
    </select>
  );
}
