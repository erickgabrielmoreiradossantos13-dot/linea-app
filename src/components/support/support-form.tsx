"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SUPPORT_CATEGORY_LABELS, SUPPORT_PRIORITY_LABELS } from "@/lib/types";
import type { SupportCategory, SupportPriority } from "@/lib/types";
import { createSupportRequestAction } from "@/app/dashboard/support/actions";

const CATEGORIES = Object.keys(SUPPORT_CATEGORY_LABELS) as SupportCategory[];
const PRIORITIES = Object.keys(SUPPORT_PRIORITY_LABELS) as SupportPriority[];

export function SupportForm({ onCreated }: { onCreated?: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SupportCategory>("cambio_contenido");
  const [priority, setPriority] = useState<SupportPriority>("media");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await createSupportRequestAction({ title, description, category, priority });
      if (result.error) {
        setFeedback({ type: "error", message: result.error });
        return;
      }
      setTitle("");
      setDescription("");
      setPriority("media");
      setFeedback({ type: "success", message: "Solicitud enviada. Te avisaremos cuando la revisemos." });
      onCreated?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink-700">Título</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Cambiar el horario de sábados"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink-700">Descripción</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Cuéntanos qué necesitas con el máximo detalle posible."
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-700">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as SupportCategory)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SUPPORT_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-700">Prioridad</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as SupportPriority)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {SUPPORT_PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
          {feedback.message}
        </p>
      )}

      <Button type="submit" loading={isPending}>
        Enviar solicitud
      </Button>
    </form>
  );
}
