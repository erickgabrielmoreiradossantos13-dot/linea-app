"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { saveIntegrationsAction } from "@/app/dashboard/integrations/actions";
import type { IntegrationSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const INPUT =
  "w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition-all duration-150 focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

interface FieldDef {
  key: keyof Pick<
    IntegrationSettings,
    "ga4_measurement_id" | "gtm_container_id" | "google_ads_conversion_id" | "meta_pixel_id"
  >;
  label: string;
  placeholder: string;
  hint: string;
}

const FIELDS: FieldDef[] = [
  {
    key: "ga4_measurement_id",
    label: "Google Analytics 4",
    placeholder: "G-XXXXXXXXXX",
    hint: "ID de medición de tu propiedad GA4.",
  },
  {
    key: "gtm_container_id",
    label: "Google Tag Manager",
    placeholder: "GTM-XXXXXXX",
    hint: "ID del contenedor de GTM.",
  },
  {
    key: "google_ads_conversion_id",
    label: "Google Ads",
    placeholder: "AW-XXXXXXXXX",
    hint: "ID de conversión de Google Ads.",
  },
  {
    key: "meta_pixel_id",
    label: "Meta Pixel (Facebook/Instagram Ads)",
    placeholder: "1234567890123456",
    hint: "ID del píxel de Meta.",
  },
];

export function IntegrationsForm({ settings }: { settings: IntegrationSettings }) {
  const [values, setValues] = useState({
    ga4_measurement_id: settings.ga4_measurement_id ?? "",
    gtm_container_id: settings.gtm_container_id ?? "",
    google_ads_conversion_id: settings.google_ads_conversion_id ?? "",
    meta_pixel_id: settings.meta_pixel_id ?? "",
  });
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await saveIntegrationsAction({
        ga4_measurement_id: values.ga4_measurement_id.trim() || null,
        gtm_container_id: values.gtm_container_id.trim() || null,
        google_ads_conversion_id: values.google_ads_conversion_id.trim() || null,
        meta_pixel_id: values.meta_pixel_id.trim() || null,
      });

      setFeedback(
        result.error
          ? { type: "error", message: result.error }
          : { type: "success", message: "Configuración guardada." }
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {FIELDS.map((field) => {
        const connected = values[field.key].trim().length > 0;
        return (
          <div key={field.key} className="space-y-1">
            <div className="flex items-center gap-2">
              {connected ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-ink-300" />
              )}
              <label className="text-sm font-medium text-ink-800">{field.label}</label>
              <span
                className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium",
                  connected ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"
                )}
              >
                {connected ? "Conectado" : "No conectado"}
              </span>
            </div>
            <input
              className={INPUT}
              placeholder={field.placeholder}
              value={values[field.key]}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            />
            <p className="text-xs text-ink-400">{field.hint}</p>
          </div>
        );
      })}

      {feedback && (
        <p className={cn("text-sm", feedback.type === "success" ? "text-emerald-600" : "text-red-600")}>
          {feedback.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-ink-800 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar"}
      </button>

      <p className="border-t border-ink-100 pt-3 text-xs leading-relaxed text-ink-400">
        Guardar aquí el ID activa las etiquetas en tu web (ver snippet más abajo). Para ver los datos
        de Google/Meta directamente dentro de Línea App hace falta conectar sus APIs — eso todavía no
        está disponible y requiere credenciales de esas plataformas.
      </p>
    </form>
  );
}
