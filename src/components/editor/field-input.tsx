"use client";

import { Input, Textarea } from "@/components/ui/input";
import type { FieldType, FieldConfig } from "@/lib/types";

const BRAND_COLOR_SWATCHES = ["#4640d6", "#e2503f", "#0284c7", "#059669", "#ea580c", "#16161a"];

interface FieldInputProps {
  type: FieldType;
  value: string;
  onChange: (value: string) => void;
  config?: FieldConfig;
  onOpenMediaLibrary?: () => void;
}

/**
 * Despachador único de campos editables: en vez de 16 componentes casi
 * idénticos, un único componente resuelve el control adecuado según
 * field_type. Cubre los tipos definidos en el Editable Schema; los tipos
 * "collection" se gestionan aparte (ver collection-field.tsx).
 */
export function FieldInput({ type, value, onChange, config, onOpenMediaLibrary }: FieldInputProps) {
  switch (type) {
    case "textarea":
    case "rich_text":
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          maxLength={config?.maxLength}
          placeholder={config?.placeholder}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config?.placeholder}
        />
      );

    case "price":
      return (
        <div className="relative">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pr-8"
            placeholder={config?.placeholder ?? "0"}
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-400">
            €
          </span>
        </div>
      );

    case "boolean":
      return (
        <button
          type="button"
          onClick={() => onChange(value === "true" ? "false" : "true")}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            value === "true" ? "bg-brand-500" : "bg-ink-200"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              value === "true" ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </button>
      );

    case "select":
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        >
          {(config?.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "date":
      return <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />;

    case "color":
      return (
        <div className="flex flex-wrap gap-2">
          {BRAND_COLOR_SWATCHES.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => onChange(hex)}
              className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                value === hex ? "border-ink-900" : "border-transparent"
              }`}
              style={{ backgroundColor: hex }}
              aria-label={hex}
            />
          ))}
        </div>
      );

    case "image":
    case "gallery":
      return (
        <button
          type="button"
          onClick={onOpenMediaLibrary}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 bg-ink-50/60 px-4 py-8 text-sm text-ink-500 transition-colors hover:border-brand-400 hover:text-brand-600"
        >
          {value ? "Cambiar imagen" : "Elegir de la biblioteca"}
        </button>
      );

    case "location":
      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config?.placeholder ?? "Calle, número, ciudad"}
        />
      );

    case "opening_hours":
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder="Lun-Vie 9:00-20:00, Sáb 10:00-14:00"
        />
      );

    case "url":
    case "email":
    case "phone":
    case "text":
    default:
      return (
        <Input
          type={type === "email" ? "email" : type === "url" ? "url" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={config?.maxLength}
          placeholder={config?.placeholder}
        />
      );
  }
}
