import { Phone, MessageCircle } from "lucide-react";

interface WebsitePreviewProps {
  headline: string;
  description: string;
  ctaText: string;
  phone: string;
  whatsapp: string;
  businessName: string;
}

export function WebsitePreview({
  headline,
  description,
  ctaText,
  phone,
  whatsapp,
  businessName,
}: WebsitePreviewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
      <div className="flex items-center gap-1.5 border-b border-ink-100 bg-ink-50/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <span className="ml-3 truncate rounded-md bg-white px-3 py-1 text-[11px] text-ink-400">
          {businessName.toLowerCase().replace(/\s+/g, "")}.es
        </span>
      </div>

      <div className="bg-gradient-to-b from-brand-50/70 to-white px-6 py-10 sm:px-10 sm:py-14">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-brand-600">
          {businessName}
        </p>
        <h2 className="max-w-md text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-3xl">
          {headline || "Título principal de tu web"}
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-500">
          {description || "Aquí aparecerá la descripción de tu negocio."}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-medium text-white">
            {ctaText || "Texto del botón"}
          </span>

          {phone && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600">
              <Phone className="h-3.5 w-3.5" /> {phone}
            </span>
          )}

          {whatsapp && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <MessageCircle className="h-3.5 w-3.5" /> {whatsapp}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
