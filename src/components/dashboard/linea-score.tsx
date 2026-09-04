"use client";

import { useEffect, useState } from "react";

interface LineaScoreProps {
  score: number;
}

function getScoreColor(score: number) {
  if (score >= 75) return { stroke: "#10b981", text: "text-emerald-600", label: "Excelente" };
  if (score >= 50) return { stroke: "#5b63f0", text: "text-brand-600", label: "Bueno" };
  if (score >= 25) return { stroke: "#f59e0b", text: "text-amber-600", label: "Mejorable" };
  return { stroke: "#ef4444", text: "text-red-600", label: "Crítico" };
}

export function LineaScore({ score }: LineaScoreProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const { stroke, text, label } = getScoreColor(clamped);

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
    <div className="flex flex-col items-center justify-center py-2">
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
      <p className={`mt-3 text-sm font-medium ${text}`}>{label}</p>
      <p className="mt-1 text-center text-xs text-ink-400">
        Salud general del negocio en Línea App
      </p>
    </div>
  );
}
