import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle, Mail } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getLeadById } from "@/lib/leads";
import { Card, CardContent } from "@/components/ui/card";
import { StatusSelect } from "@/components/leads/status-select";
import { SourceBadge } from "@/components/leads/source-badge";
import { TRAFFIC_SOURCE_LABELS } from "@/lib/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contacto · Línea App",
};

export const dynamic = "force-dynamic";

const BUTTON =
  "inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 shadow-sm transition-all duration-150 hover:bg-ink-50 active:scale-[0.97]";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-sm text-ink-900">{value || "—"}</p>
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business } = await getCurrentBusiness();
  const lead = await getLeadById(business.id, id);

  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/leads"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> Contactos
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">{lead.name}</h1>
          <p className="mt-1 text-sm text-ink-500">Recibido el {formatDate(lead.created_at)}</p>
        </div>
        <StatusSelect leadId={lead.id} status={lead.status} />
      </div>

      {(lead.phone || lead.email) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className={cn(BUTTON)}>
              <Phone className="h-4 w-4" /> Llamar
            </a>
          )}
          {lead.phone && (
            <a
              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className={cn(BUTTON)}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className={cn(BUTTON)}>
              <Mail className="h-4 w-4" /> Email
            </a>
          )}
        </div>
      )}

      <Card className="mt-5">
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <Field label="Teléfono" value={lead.phone} />
          <Field label="Email" value={lead.email} />
          <Field label="Servicio" value={lead.service} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Canal de contacto</p>
            <div className="mt-1">
              <SourceBadge source={lead.source} />
            </div>
          </div>
          <Field label="Origen del tráfico" value={lead.traffic_source ? TRAFFIC_SOURCE_LABELS[lead.traffic_source] : null} />
          <Field label="Página de origen" value={lead.landing_page} />
          <Field label="Valor estimado" value={formatCurrency(lead.value_estimate)} />
        </CardContent>
      </Card>
    </div>
  );
}
