import { MessageCircle, FileText, Phone } from "lucide-react";
import type { LeadSource } from "@/lib/types";
import { LEAD_SOURCE_LABELS } from "@/lib/types";

const SOURCE_ICON: Record<LeadSource, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  formulario: FileText,
  llamada: Phone,
};

const SOURCE_COLOR: Record<LeadSource, string> = {
  whatsapp: "text-emerald-600",
  formulario: "text-brand-600",
  llamada: "text-amber-600",
};

export function SourceBadge({ source }: { source: LeadSource }) {
  const Icon = SOURCE_ICON[source];

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${SOURCE_COLOR[source]}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="text-ink-600">{LEAD_SOURCE_LABELS[source]}</span>
    </span>
  );
}
