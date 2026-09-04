"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveBusinessSettings } from "./actions";

interface SettingsFormProps {
  businessId: string;
  avgClientValue: number | null;
  closeRate: number;
}

export function SettingsForm({ businessId, avgClientValue, closeRate }: SettingsFormProps) {
  const [value, setValue] = useState(avgClientValue !== null ? String(avgClientValue) : "");
  const [ratePercent, setRatePercent] = useState(String(Math.round(closeRate * 100)));
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const parsedValue = Number.parseFloat(value.replace(",", "."));
    const parsedRate = Number.parseFloat(ratePercent.replace(",", "."));

    if (Number.isNaN(parsedValue) || parsedValue < 0) {
      setFeedback({ type: "error", message: "Introduce un valor medio de cliente válido." });
      return;
    }

    if (Number.isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
      setFeedback({ type: "error", message: "La tasa de cierre debe estar entre 0 y 100." });
      return;
    }

    startTransition(async () => {
      try {
        await saveBusinessSettings({
          businessId,
          avgClientValue: parsedValue,
          closeRatePercent: parsedRate,
        });
        setFeedback({ type: "success", message: "Configuración guardada." });
      } catch {
        setFeedback({ type: "error", message: "No se pudo guardar la configuración." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink-700">Valor medio de un cliente (€)</label>
        <Input
          type="number"
          min={0}
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ej. 500"
        />
        <p className="text-xs text-ink-400">Cuánto factura, de media, un cliente que consigues.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ink-700">Tasa de cierre estimada (%)</label>
        <Input
          type="number"
          min={0}
          max={100}
          step="1"
          value={ratePercent}
          onChange={(e) => setRatePercent(e.target.value)}
          placeholder="Ej. 30"
        />
        <p className="text-xs text-ink-400">
          De cada 100 oportunidades, cuántas sueles terminar convirtiendo en clientes.
        </p>
      </div>

      {feedback && (
        <p
          className={`animate-fade-in-up text-sm ${
            feedback.type === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {feedback.message}
        </p>
      )}

      <Button type="submit" loading={isPending}>
        Guardar
      </Button>
    </form>
  );
}
