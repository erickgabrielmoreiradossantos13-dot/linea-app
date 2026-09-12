"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { updateLeadStatus } from "@/app/(app)/leads/server-actions";
import type { Lead, LeadStatus } from "@/lib/types";

const columns: Array<{ status: LeadStatus; label: string }> = [
  { status: "NEW", label: "Nuevos" },
  { status: "CONTACTED", label: "Contactados" },
  { status: "QUALIFIED", label: "Cualificados" },
  { status: "MEETING", label: "Reunión" },
  { status: "PROPOSAL", label: "Propuesta" },
  { status: "WON", label: "Ganados" },
  { status: "LOST", label: "Perdidos" },
];

type OptimisticMove = { id: string; status: LeadStatus };

export function KanbanBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [optimisticLeads, moveOptimistically] = useOptimistic(
    initialLeads,
    (current, move: OptimisticMove) =>
      current.map((lead) => (lead.id === move.id ? { ...lead, status: move.status } : lead))
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function moveLead(id: string, status: LeadStatus) {
    setError(null);
    startTransition(async () => {
      moveOptimistically({ id, status });
      const result = await updateLeadStatus(id, status);
      if (result.error) setError(result.error);
    });
  }

  return (
    <section aria-label="Kanban de contactos">
      {error && <div className="form-status error mb-4" role="alert">{error}</div>}
      <div className="grid gap-4 overflow-x-auto pb-3 xl:grid-cols-4">
        {columns.map((column) => {
          const leads = optimisticLeads.filter((lead) => lead.status === column.status);
          return (
            <div className="panel min-w-72 p-4" key={column.status}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold">{column.label}</h2>
                <span className="badge">{leads.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {leads.map((lead) => (
                  <article className="rounded-xl border border-neutral-200 bg-neutral-50 p-4" key={lead.id}>
                    <Link href={`/leads/${lead.id}`} className="font-bold hover:underline">{lead.name}</Link>
                    <p className="mt-1 truncate text-xs muted">{lead.email || lead.phone || "Sin datos de contacto"}</p>
                    <p className="mt-3 text-xs muted">{lead.source} · {lead.page}</p>
                    <label className="mt-3 block text-xs font-bold">
                      Mover a
                      <select
                        className="input mt-1.5"
                        value={lead.status}
                        disabled={pending}
                        onChange={(event) => moveLead(lead.id, event.target.value as LeadStatus)}
                      >
                        {columns.map((target) => <option value={target.status} key={target.status}>{target.label}</option>)}
                      </select>
                    </label>
                  </article>
                ))}
                {leads.length === 0 && <p className="rounded-xl border border-dashed border-neutral-200 p-5 text-center text-xs muted">Sin contactos</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
