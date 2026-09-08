"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createLeadAction } from "@/app/dashboard/leads/actions";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const INPUT =
  "w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition-all duration-150 focus:border-brand-400 focus:ring-4 focus:ring-brand-100";
const LABEL = "text-xs font-medium text-ink-600";

export function CreateLeadModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [status, setStatus] = useState<LeadStatus>("nuevo");
  const [valueEstimate, setValueEstimate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function reset() {
    setName("");
    setPhone("");
    setEmail("");
    setService("");
    setStatus("nuevo");
    setValueEstimate("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createLeadAction({ name, phone, email, service, status, valueEstimate });
      if (result.error) {
        setError(result.error);
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3.5 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-ink-800 active:scale-[0.97]"
      >
        <Plus className="h-4 w-4" />
        Nuevo contacto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-popover">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-900">Nuevo contacto</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className={LABEL}>Nombre *</label>
                <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={LABEL}>Teléfono</label>
                  <input className={INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className={LABEL}>Email</label>
                  <input
                    type="email"
                    className={INPUT}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={LABEL}>Servicio de interés</label>
                <input className={INPUT} value={service} onChange={(e) => setService(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={LABEL}>Estado</label>
                  <select
                    className={cn(INPUT, "cursor-pointer")}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {LEAD_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={LABEL}>Valor potencial (€)</label>
                  <input
                    inputMode="decimal"
                    className={INPUT}
                    value={valueEstimate}
                    onChange={(e) => setValueEstimate(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-ink-900 px-3.5 py-2 text-sm font-medium text-white transition-all hover:bg-ink-800 disabled:opacity-60"
                >
                  {isPending ? "Guardando…" : "Crear contacto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
