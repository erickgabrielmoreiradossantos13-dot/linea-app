"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, CircleDot } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WebsitePreview } from "./website-preview";
import { saveDraft, publishContent } from "@/app/dashboard/website/actions";
import type { WebsiteContent } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface WebsiteEditorProps {
  businessId: string;
  businessName: string;
  content: WebsiteContent;
}

type FeedbackState = { type: "success" | "error"; message: string } | null;

export function WebsiteEditor({ businessId, businessName, content }: WebsiteEditorProps) {
  const [headline, setHeadline] = useState(content.headline);
  const [description, setDescription] = useState(content.description);
  const [ctaText, setCtaText] = useState(content.cta_text);
  const [phone, setPhone] = useState(content.phone);
  const [whatsapp, setWhatsapp] = useState(content.whatsapp);

  const [publishedAt, setPublishedAt] = useState(content.published_at);
  const [publishedSnapshot, setPublishedSnapshot] = useState({
    headline: content.published_headline,
    description: content.published_description,
    ctaText: content.published_cta_text,
    phone: content.published_phone,
    whatsapp: content.published_whatsapp,
  });

  const [isSavingDraft, startSavingDraft] = useTransition();
  const [isPublishing, startPublishing] = useTransition();
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const hasUnpublishedChanges = useMemo(() => {
    return (
      headline !== (publishedSnapshot.headline ?? "") ||
      description !== (publishedSnapshot.description ?? "") ||
      ctaText !== (publishedSnapshot.ctaText ?? "") ||
      phone !== (publishedSnapshot.phone ?? "") ||
      whatsapp !== (publishedSnapshot.whatsapp ?? "")
    );
  }, [headline, description, ctaText, phone, whatsapp, publishedSnapshot]);

  function currentInput() {
    return { businessId, headline, description, ctaText, phone, whatsapp };
  }

  function handleSaveDraft() {
    setFeedback(null);
    startSavingDraft(async () => {
      try {
        await saveDraft(currentInput());
        setFeedback({ type: "success", message: "Borrador guardado." });
      } catch {
        setFeedback({ type: "error", message: "No se pudo guardar el borrador." });
      }
    });
  }

  function handlePublish() {
    setFeedback(null);
    startPublishing(async () => {
      try {
        await publishContent(currentInput());
        setPublishedSnapshot({ headline, description, ctaText, phone, whatsapp });
        setPublishedAt(new Date().toISOString());
        setFeedback({ type: "success", message: "Cambios publicados en la web." });
      } catch {
        setFeedback({ type: "error", message: "No se pudieron publicar los cambios." });
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            {hasUnpublishedChanges ? (
              <>
                <CircleDot className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-ink-500">Cambios sin publicar</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-ink-500">Todo publicado</span>
              </>
            )}
          </div>
          {publishedAt && (
            <span className="text-xs text-ink-400">
              Última publicación: {formatDate(publishedAt)}
            </span>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-700">Título principal</label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={80}
              placeholder="Ej. Cuida tu sonrisa con los mejores especialistas"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-700">Descripción</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={280}
              placeholder="Describe brevemente tu negocio y lo que ofreces."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-700">Texto del botón</label>
            <Input
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              maxLength={30}
              placeholder="Ej. Pide tu cita"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink-700">Teléfono</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 900 000 000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink-700">WhatsApp</label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+34 600 000 000"
              />
            </div>
          </div>
        </div>

        {feedback && (
          <p
            className={`mt-4 text-sm ${
              feedback.type === "success" ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {feedback.message}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleSaveDraft} loading={isSavingDraft}>
            Guardar borrador
          </Button>
          <Button onClick={handlePublish} loading={isPublishing}>
            Publicar cambios
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-400">
          Vista previa
        </p>
        <WebsitePreview
          headline={headline}
          description={description}
          ctaText={ctaText}
          phone={phone}
          whatsapp={whatsapp}
          businessName={businessName}
        />
      </div>
    </div>
  );
}
