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
  const offset = circumference * (1 - clamped / 100);
  const { stroke, text, label } = getScoreColor(clamped);

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
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tracking-tight text-ink-900">{clamped}</span>
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
