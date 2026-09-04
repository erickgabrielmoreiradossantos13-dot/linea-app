import { MessageCircle, FileText, Phone } from "lucide-react";
import type { LeadSource } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface ChannelBreakdownProps {
  data: Record<LeadSource, number>;
}

const CHANNELS: { key: LeadSource; label: string; icon: typeof MessageCircle; color: string }[] = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600 bg-emerald-50" },
  { key: "formulario", label: "Formularios", icon: FileText, color: "text-brand-600 bg-brand-50" },
  { key: "llamada", label: "Llamadas", icon: Phone, color: "text-amber-600 bg-amber-50" },
];

export function ChannelBreakdown({ data }: ChannelBreakdownProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {CHANNELS.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50/40 px-4 py-3.5"
        >
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <div>
            <p className="text-lg font-semibold leading-none text-ink-900">
              {formatNumber(data[key] ?? 0)}
            </p>
            <p className="mt-1 text-xs text-ink-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
