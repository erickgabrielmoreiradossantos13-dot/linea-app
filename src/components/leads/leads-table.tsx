import Link from "next/link";
import { Mail, Phone as PhoneIcon } from "lucide-react";
import type { Lead } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { StatusSelect } from "./status-select";
import { SourceBadge } from "./source-badge";

interface LeadsTableProps {
  leads: Lead[];
}

export function LeadsTable({ leads }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white py-16 text-center">
        <p className="text-sm font-medium text-ink-600">Todavía no hay leads</p>
        <p className="mt-1 text-sm text-ink-400">
          En cuanto recibas contactos por WhatsApp, formulario o llamada, aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-xs font-medium uppercase tracking-wide text-ink-400">
              <th className="px-5 py-3">Nombre</th>
              <th className="px-5 py-3">Contacto</th>
              <th className="px-5 py-3">Servicio</th>
              <th className="px-5 py-3">Origen</th>
              <th className="px-5 py-3">Valor est.</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="transition-all duration-150 hover:bg-ink-50/60 hover:shadow-[inset_3px_0_0_0_#5b63f0]"
              >
                <td className="whitespace-nowrap px-5 py-3.5 font-medium text-ink-900">
                  <Link href={`/dashboard/leads/${lead.id}`} className="hover:text-brand-600 hover:underline">
                    {lead.name}
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-col gap-0.5 text-xs text-ink-500">
                    {lead.phone && (
                      <span className="flex items-center gap-1.5">
                        <PhoneIcon className="h-3 w-3" /> {lead.phone}
                      </span>
                    )}
                    {lead.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> {lead.email}
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-ink-600">
                  {lead.service ?? "—"}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5">
                  <SourceBadge source={lead.source} />
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-ink-600">
                  {formatCurrency(lead.value_estimate)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-ink-500">
                  {formatDate(lead.created_at)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5">
                  <StatusSelect leadId={lead.id} status={lead.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
