"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SCORE_COMPONENT_LABELS, type LineaScoreResult } from "@/lib/scoring";
import { cn } from "@/lib/utils";

function getScoreColor(score: number) {
  if (score >= 75) return { stroke: "#10b981", text: "text-emerald-600", bar: "bg-emerald-500" };
  if (score >= 50) return { stroke: "#5b63f0", text: "text-brand-600", bar: "bg-brand-500" };
  if (score >= 25) return { stroke: "#f59e0b", text: "text-amber-600", bar: "bg-amber-500" };
  return { stroke: "#ef4444", text: "text-red-600", bar: "bg-red-500" };
}

export function LineaScore({ result }: { result: LineaScoreResult }) {
  const [showDetail, setShowDetail] = useState(false);
  const clamped = Math.min(100, Math.max(0, result.total));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const { stroke, text } = getScoreColor(clamped);

  const [progress, setProgress] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setProgress(clamped));

    const duration = 900;
    let animFrame = 0;
    let start: number | null = null;

    function step(timestamp: number) {
      if (start === null) start = timestamp;
      const t = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(clamped * eased));
      if (t < 1) animFrame = requestAnimationFrame(step);
    }
    animFrame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(animFrame);
    };
  }, [clamped]);

  const offset = circumference * (1 - progress / 100);

  return (
    <div className="flex flex-col items-center py-2">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#eeeef0" strokeWidth="10" />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tracking-tight tabular-nums text-ink-900">
            {displayScore}
          </span>
          <span className="text-xs text-ink-400">sobre 100</span>
        </div>
      </div>
      <p className={`mt-3 text-sm font-medium ${text}`}>{result.label}</p>
      <p className="mt-1 text-center text-xs text-ink-400">Salud general del negocio en Línea App</p>

      <button
        type="button"
        onClick={() => setShowDetail((v) => !v)}
        className="mt-4 flex items-center gap-1 text-xs font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        Cómo calculamos tu Línea Score
        <ChevronDown className={cn("size-3.5 transition-transform duration-150", showDetail && "rotate-180")} />
      </button>

      {showDetail && (
        <div className="mt-3 w-full space-y-2.5 border-t border-ink-100 pt-3">
          {(Object.keys(result.breakdown) as (keyof typeof result.breakdown)[]).map((key) => {
            const value = result.breakdown[key];
            const { bar } = getScoreColor(value);
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-500">{SCORE_COMPONENT_LABELS[key]}</span>
                  <span className="font-medium text-ink-900">{value}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-ink-100">
                  <div
                    className={cn("h-1.5 rounded-full transition-all duration-500", bar)}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="pt-1 text-[11px] leading-relaxed text-ink-400">
            Cada componente sale de datos reales de tu negocio (o de un valor neutro cuando algo
            todavía no está conectado, nunca de una estimación inventada). El total es una media
            ponderada de los cinco.
          </p>
        </div>
      )}
    </div>
  );
}
