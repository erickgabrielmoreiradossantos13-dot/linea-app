import { SUPPORT_CATEGORY_LABELS, SUPPORT_STATUS_LABELS } from "@/lib/types";
import type { SupportRequest, SupportStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<SupportStatus, string> = {
  recibida: "bg-ink-100 text-ink-600",
  revisando: "bg-amber-50 text-amber-700",
  en_progreso: "bg-brand-50 text-brand-700",
  resuelta: "bg-emerald-50 text-emerald-700",
};

export function SupportRequestCard({ request }: { request: SupportRequest }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[15px] font-semibold text-ink-900">{request.title}</p>
          <p className="mt-1 text-xs text-ink-400">
            {SUPPORT_CATEGORY_LABELS[request.category]} · {formatDate(request.created_at)}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", STATUS_STYLES[request.status])}>
          {SUPPORT_STATUS_LABELS[request.status]}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-600">{request.description}</p>

      {request.response_notes && (
        <div className="mt-3 rounded-lg bg-ink-50/60 px-3.5 py-2.5 text-sm text-ink-700">
          <span className="font-medium">Línea Sur: </span>
          {request.response_notes}
        </div>
      )}
    </div>
  );
}
