import { Phone, MessageCircle, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export type PreviewViewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTH: Record<PreviewViewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

interface SitePreviewProps {
  businessName: string;
  domain: string | null;
  /** Valores agrupados por clave de sección → clave de campo. */
  sections: Record<string, Record<string, string>>;
  viewport: PreviewViewport;
  /** Edición visual MVP: clic en un elemento de la preview abre su campo en el editor. */
  onSelectField?: (sectionKey: string, fieldKey: string) => void;
}

/** Envuelve un valor editable con hover (lápiz) + clic → abrir su campo. */
function Editable({
  sectionKey,
  fieldKey,
  onSelectField,
  className,
  children,
}: {
  sectionKey: string;
  fieldKey: string;
  onSelectField?: (sectionKey: string, fieldKey: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  if (!onSelectField) return <div className={className}>{children}</div>;

  return (
    <button
      type="button"
      onClick={() => onSelectField(sectionKey, fieldKey)}
      className={cn(
        "group/editable relative w-full rounded-md text-left outline-none transition-colors hover:bg-brand-500/[0.06] focus-visible:bg-brand-500/[0.06]",
        className
      )}
    >
      {children}
      <span className="pointer-events-none absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover/editable:opacity-100">
        <Pencil className="h-3 w-3" />
      </span>
    </button>
  );
}

/**
 * Renderiza bien la sección "hero" (el mismo diseño que ya conocíamos) y
 * cualquier otra sección con una tarjeta genérica de clave/valor. No es un
 * motor de diseño universal: por ahora solo el sitio de Clínica Aurora existe,
 * así que optimizamos para eso sin fingir soportar layouts que no existen.
 */
export function SitePreview({ businessName, domain, sections, viewport, onSelectField }: SitePreviewProps) {
  const hero = sections.hero;
  const contact = sections.contact;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
      <div className="flex items-center gap-1.5 border-b border-ink-100 bg-ink-50/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <span className="ml-3 truncate rounded-md bg-white px-3 py-1 text-[11px] text-ink-400">
          {domain ?? `${businessName.toLowerCase().replace(/\s+/g, "")}.es`}
        </span>
      </div>

      <div className="flex justify-center overflow-x-auto bg-ink-100/40 p-4">
        <div
          className="w-full shrink-0 bg-white transition-[width] duration-200"
          style={{ width: VIEWPORT_WIDTH[viewport] }}
        >
          {hero && (
            <div className="bg-gradient-to-b from-brand-50/70 to-white px-6 py-10 sm:px-10 sm:py-14">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                {businessName}
              </p>
              <Editable sectionKey="hero" fieldKey="title" onSelectField={onSelectField}>
                <h2 className="max-w-md text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-3xl">
                  {hero.title || "Título principal de tu web"}
                </h2>
              </Editable>
              <Editable sectionKey="hero" fieldKey="subtitle" onSelectField={onSelectField} className="mt-4">
                <p className="max-w-md text-sm leading-relaxed text-ink-500">
                  {hero.subtitle || "Aquí aparecerá la descripción de tu negocio."}
                </p>
              </Editable>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Editable sectionKey="hero" fieldKey="ctaLabel" onSelectField={onSelectField} className="w-auto">
                  <span className="inline-flex items-center rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-medium text-white">
                    {hero.ctaLabel || "Texto del botón"}
                  </span>
                </Editable>

                {contact?.phone && (
                  <Editable sectionKey="contact" fieldKey="phone" onSelectField={onSelectField} className="w-auto">
                    <span className="inline-flex items-center gap-1.5 px-1 text-sm font-medium text-ink-600">
                      <Phone className="h-3.5 w-3.5" /> {contact.phone}
                    </span>
                  </Editable>
                )}

                {contact?.whatsapp && (
                  <Editable sectionKey="contact" fieldKey="whatsapp" onSelectField={onSelectField} className="w-auto">
                    <span className="inline-flex items-center gap-1.5 px-1 text-sm font-medium text-emerald-600">
                      <MessageCircle className="h-3.5 w-3.5" /> {contact.whatsapp}
                    </span>
                  </Editable>
                )}
              </div>
            </div>
          )}

          {Object.entries(sections)
            .filter(([key]) => key !== "hero" && key !== "contact")
            .map(([key, fields]) => (
              <div key={key} className="border-t border-ink-100 px-6 py-6">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  {key}
                </p>
                <div className="space-y-1 text-sm text-ink-600">
                  {Object.entries(fields).map(([fieldKey, value]) => (
                    <p key={fieldKey}>{value || "—"}</p>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
