"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Business } from "@/lib/types";
import { createSite } from "./actions";

export function AddSiteForm({ businesses }: { businesses: Business[] }) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [productionUrl, setProductionUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!businessId || !name) {
      setFeedback({ type: "error", message: "Elige un negocio y ponle un nombre al sitio." });
      return;
    }

    startTransition(async () => {
      try {
        await createSite({ businessId, name, domain, productionUrl, previewUrl, framework: "linea-nextjs" });
        setFeedback({ type: "success", message: "Sitio creado. Configura su contenido editable por SQL." });
        setName("");
        setDomain("");
        setProductionUrl("");
        setPreviewUrl("");
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "No se pudo crear el sitio.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink-700">Negocio</label>
        <select
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          className="w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink-700">Nombre del sitio</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Clínica Aurora" />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink-700">Dominio</label>
        <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="ejemplo.es" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-700">URL de producción</label>
          <Input
            value={productionUrl}
            onChange={(e) => setProductionUrl(e.target.value)}
            placeholder="https://ejemplo.es"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-700">URL de preview</label>
          <Input
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            placeholder="https://preview.ejemplo.es"
          />
        </div>
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
          {feedback.message}
        </p>
      )}

      <Button type="submit" loading={isPending}>
        Añadir sitio
      </Button>
    </form>
  );
}
