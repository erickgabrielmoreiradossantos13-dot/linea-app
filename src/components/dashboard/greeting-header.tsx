import { formatNumber } from "@/lib/utils";
import type { PeriodDelta } from "@/lib/dashboard";

function getMadridHour(): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    hour: "numeric",
    hour12: false,
  }).format(new Date());
  return parseInt(formatted, 10);
}

function getGreeting(): string {
  const hour = getMadridHour();
  if (hour >= 6 && hour < 14) return "Buenos días";
  if (hour >= 14 && hour < 21) return "Buenas tardes";
  return "Buenas noches";
}

function getPerformanceStatus(delta: PeriodDelta): { color: string; dot: string; label: string } {
  if (delta.percent === null || delta.direction === "flat") {
    return { color: "text-ink-500", dot: "bg-ink-300", label: "Rendimiento estable" };
  }
  if (delta.direction === "up") {
    return { color: "text-emerald-700", dot: "bg-emerald-500", label: "Rendimiento positivo" };
  }
  return { color: "text-orange-700", dot: "bg-orange-500", label: "Necesita atención" };
}

interface GreetingHeaderProps {
  businessName: string;
  opportunities: number;
  opportunitiesDelta: PeriodDelta;
  isDemo?: boolean;
}

export function GreetingHeader({
  businessName,
  opportunities,
  opportunitiesDelta,
  isDemo = false,
}: GreetingHeaderProps) {
  const status = getPerformanceStatus(opportunitiesDelta);

  return (
    <div className="relative mb-6 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-6 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-brand-500/10 to-secondary-500/5 blur-2xl"
      />

      <div className="relative flex flex-wrap items-center gap-2.5">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">
          {getGreeting()}, {businessName}
        </h1>
        <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-[11px] font-medium text-ink-500">
          Últimos 30 días
        </span>
        {isDemo && (
          <span
            className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700"
            title="Los datos que ves aquí son ilustrativos, no de un negocio real."
          >
            Datos de demostración
          </span>
        )}
      </div>

      <p className="relative mt-1.5 text-[15px] leading-relaxed text-ink-500">
        Tu presencia digital generó{" "}
        <span className="font-semibold text-ink-900">{formatNumber(opportunities)} oportunidades comerciales</span>{" "}
        en los últimos 30 días.
      </p>

      <div className="relative mt-2 flex items-center gap-1.5 text-xs font-medium">
        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
        <span className={status.color}>{status.label}</span>
        {opportunitiesDelta.percent !== null && (
          <span className="text-ink-400">
            · {opportunitiesDelta.percent > 0 ? "+" : ""}
            {Math.round(opportunitiesDelta.percent * 100)}% respecto al periodo anterior
          </span>
        )}
      </div>
    </div>
  );
}
