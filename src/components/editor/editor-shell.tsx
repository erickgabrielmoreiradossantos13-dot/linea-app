"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Laptop,
  Tablet,
  Smartphone,
  History,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldInput } from "@/components/editor/field-input";
import { SitePreview, type PreviewViewport } from "@/components/editor/site-preview";
import { MediaLibraryModal } from "@/components/editor/media-library-modal";
import { cn, formatDate } from "@/lib/utils";
import type { MediaAsset, SiteChangeLogEntry, SiteSchema } from "@/lib/types";
import { saveFieldDraftAction, discardDraftAction, publishSiteAction } from "@/app/dashboard/website/edit/actions";

interface EditorShellProps {
  businessId: string;
  businessName: string;
  schema: SiteSchema;
  initialValues: Record<string, { draft: string; published: string }>;
  changeLog: SiteChangeLogEntry[];
  mediaAssets: MediaAsset[];
}

const VIEWPORTS: { key: PreviewViewport; icon: typeof Laptop; label: string }[] = [
  { key: "desktop", icon: Laptop, label: "Escritorio" },
  { key: "tablet", icon: Tablet, label: "Tablet" },
  { key: "mobile", icon: Smartphone, label: "Móvil" },
];

export function EditorShell({
  businessId,
  businessName,
  schema,
  initialValues,
  changeLog,
  mediaAssets,
}: EditorShellProps) {
  const allFields = useMemo(
    () => schema.pages.flatMap((p) => p.sections.flatMap((s) => s.fields)),
    [schema]
  );

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(allFields.map((f) => [f.id, initialValues[f.id]?.draft ?? ""]))
  );
  const [published, setPublished] = useState<Record<string, string>>(() =>
    Object.fromEntries(allFields.map((f) => [f.id, initialValues[f.id]?.published ?? ""]))
  );

  const firstSection = schema.pages[0]?.sections[0];
  const [selectedPageId, setSelectedPageId] = useState(schema.pages[0]?.id);
  const [selectedSectionId, setSelectedSectionId] = useState(firstSection?.id);
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [mediaFieldId, setMediaFieldId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [isPublishing, startPublishing] = useTransition();
  const [isDiscarding, startDiscarding] = useTransition();
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const selectedPage = schema.pages.find((p) => p.id === selectedPageId) ?? schema.pages[0];
  const selectedSection = selectedPage?.sections.find((s) => s.id === selectedSectionId) ?? firstSection;

  const unpublishedCount = allFields.filter((f) => values[f.id] !== published[f.id]).length;

  const previewSections = useMemo(() => {
    const out: Record<string, Record<string, string>> = {};
    for (const page of schema.pages) {
      for (const section of page.sections) {
        out[section.key] = Object.fromEntries(section.fields.map((f) => [f.key, values[f.id] ?? ""]));
      }
    }
    return out;
  }, [schema, values]);

  function handleFieldChange(fieldId: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));

    clearTimeout(debounceRef.current[fieldId]);
    debounceRef.current[fieldId] = setTimeout(() => {
      saveFieldDraftAction(fieldId, value).catch(() => {
        setFeedback("No se pudo guardar el borrador.");
      });
    }, 500);
  }

  function handleDiscard() {
    setFeedback(null);
    startDiscarding(async () => {
      try {
        await discardDraftAction(schema.site.id);
        setValues({ ...published });
      } catch {
        setFeedback("No se pudieron descartar los cambios.");
      }
    });
  }

  function handlePublish() {
    setFeedback("publishing");
    startPublishing(async () => {
      try {
        await publishSiteAction(schema.site.id);
        setPublished({ ...values });
        setFeedback("published");
      } catch {
        setFeedback("No se pudieron publicar los cambios.");
      }
    });
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/website"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" /> {businessName}
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
          >
            <History className="h-4 w-4" /> Historial
          </button>

          {unpublishedCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              <CircleDot className="h-3 w-3 animate-pulse" /> Cambios sin publicar: {unpublishedCount}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Todo publicado
            </span>
          )}

          <Button variant="secondary" onClick={handleDiscard} loading={isDiscarding} disabled={unpublishedCount === 0}>
            Descartar
          </Button>
          <Button onClick={handlePublish} loading={isPublishing} disabled={unpublishedCount === 0}>
            Publicar
          </Button>
        </div>
      </div>

      {feedback === "published" && (
        <p className="mb-4 animate-fade-in-up text-sm font-medium text-emerald-600">
          ✓ Tu web está actualizada
        </p>
      )}
      {feedback && feedback !== "published" && feedback !== "publishing" && (
        <p className="mb-4 animate-fade-in-up text-sm text-red-600">{feedback}</p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr_1fr]">
        {/* Árbol de páginas y secciones */}
        <div className="rounded-2xl border border-ink-100 bg-white p-3">
          {schema.pages.map((page) => (
            <div key={page.id} className="mb-2">
              <button
                onClick={() => setSelectedPageId(page.id)}
                className="w-full rounded-lg px-2.5 py-1.5 text-left text-sm font-semibold text-ink-900 hover:bg-ink-50"
              >
                {page.name}
              </button>
              {page.id === selectedPageId && (
                <div className="ml-2 mt-1 space-y-0.5 border-l border-ink-100 pl-2">
                  {page.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSectionId(section.id)}
                      className={cn(
                        "w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
                        section.id === selectedSectionId
                          ? "bg-brand-50 font-medium text-brand-700"
                          : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                      )}
                    >
                      {section.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Formulario de campos de la sección seleccionada */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-ink-900">{selectedSection?.name}</h3>
          <div className="space-y-4">
            {selectedSection?.fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="text-sm font-medium text-ink-700">{field.label}</label>
                <FieldInput
                  type={field.field_type}
                  value={values[field.id] ?? ""}
                  onChange={(v) => handleFieldChange(field.id, v)}
                  config={field.config}
                  onOpenMediaLibrary={() => setMediaFieldId(field.id)}
                />
              </div>
            ))}
            {(!selectedSection || selectedSection.fields.length === 0) && (
              <p className="text-sm text-ink-400">Esta sección todavía no tiene campos editables.</p>
            )}
          </div>
        </div>

        {/* Vista previa */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Vista previa</p>
            <div className="flex items-center gap-1 rounded-lg border border-ink-100 bg-white p-1">
              {VIEWPORTS.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setViewport(key)}
                  title={label}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                    viewport === key ? "bg-ink-900 text-white" : "text-ink-400 hover:bg-ink-100"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
          <SitePreview
            businessName={businessName}
            domain={schema.site.domain}
            sections={previewSections}
            viewport={viewport}
          />
          {schema.site.production_url && (
            <a
              href={schema.site.production_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Ver web publicada <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {mediaFieldId && (
        <MediaLibraryModal
          businessId={businessId}
          initialAssets={mediaAssets}
          onSelect={(url) => {
            handleFieldChange(mediaFieldId, url);
            setMediaFieldId(null);
          }}
          onClose={() => setMediaFieldId(null)}
        />
      )}

      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-popover"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-sm font-semibold text-ink-900">Historial de cambios</h3>
            {changeLog.length > 0 ? (
              <ul className="space-y-3">
                {changeLog.map((entry) => (
                  <li key={entry.id} className="border-b border-ink-100 pb-3 last:border-0">
                    <p className="text-xs text-ink-400">{formatDate(entry.created_at)}</p>
                    <p className="text-sm text-ink-700">{entry.summary}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-400">Todavía no hay cambios publicados.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
