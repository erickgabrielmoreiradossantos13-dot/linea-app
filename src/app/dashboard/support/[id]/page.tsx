import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getSupportRequestById, getSupportComments } from "@/lib/support";
import { Card, CardContent } from "@/components/ui/card";
import { SupportCommentThread } from "@/components/support/support-comment-thread";
import { SUPPORT_CATEGORY_LABELS, SUPPORT_STATUS_LABELS } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import type { SupportStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Solicitud · Línea App",
};

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<SupportStatus, string> = {
  recibida: "bg-ink-100 text-ink-600",
  revisando: "bg-amber-50 text-amber-700",
  en_progreso: "bg-brand-50 text-brand-700",
  resuelta: "bg-emerald-50 text-emerald-700",
};

export default async function SupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business } = await getCurrentBusiness();
  const request = await getSupportRequestById(business.id, id);
  if (!request) notFound();

  const comments = await getSupportComments(business.id, request.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/support"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> Solicitudes
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">{request.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {SUPPORT_CATEGORY_LABELS[request.category]} · {formatDate(request.created_at)}
          </p>
        </div>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLES[request.status])}>
          {SUPPORT_STATUS_LABELS[request.status]}
        </span>
      </div>

      <Card className="mt-5">
        <CardContent className="p-5">
          <p className="text-sm leading-relaxed text-ink-700">{request.description}</p>
          {request.response_notes && (
            <div className="mt-3 rounded-lg bg-ink-50/60 px-3.5 py-2.5 text-sm text-ink-700">
              <span className="font-medium">Línea Sur: </span>
              {request.response_notes}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Historial</h2>
        <SupportCommentThread requestId={request.id} initialComments={comments} />
      </div>
    </div>
  );
}
