import Link from "next/link";
import { Settings2 } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { EmptyState } from "./empty-state";

interface CommercialValueCardProps {
  opportunities: number;
  avgClientValue: number | null;
  closeRate: number;
}

export function CommercialValueCard({
  opportunities,
  avgClientValue,
  closeRate,
}: CommercialValueCardProps) {
  if (avgClientValue === null) {
    return (
      <EmptyState
        icon={Settings2}
        title="Configura el valor comercial potencial"
        description="Indica cuánto vale un cliente medio para tu negocio y calcularemos automáticamente el valor estimado de tus oportunidades."
        action={
          <Link
            href="/dashboard/settings"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Ir a Configuración →
          </Link>
        }
      />
    );
  }

  const estimatedClients = Math.round(opportunities * closeRate);
  const potentialValue = estimatedClients * avgClientValue;

  return (
    <div>
      <div className="space-y-1.5 text-sm text-ink-500">
        <p>{formatNumber(opportunities)} oportunidades</p>
        <p>
          × <span className="text-ink-700">{formatPercent(closeRate)}</span> tasa de cierre estimada
        </p>
        <p>
          ≈ <span className="font-medium text-ink-700">{formatNumber(estimatedClients)} clientes</span>
        </p>
        <p>
          × <span className="text-ink-700">{formatCurrency(avgClientValue)}</span> valor medio
        </p>
      </div>

      <p className="mt-3 text-[26px] font-semibold leading-none tracking-tight tabular-nums text-ink-900">
        ≈ {formatCurrency(potentialValue)}
      </p>
      <p className="mt-1 text-xs text-ink-400">de valor comercial potencial</p>

      <p className="mt-4 text-xs leading-relaxed text-ink-400">
        Estimación basada en valores configurados por el negocio. No representa ingresos
        confirmados.
      </p>

      <Link
        href="/dashboard/settings"
        className="mt-3 inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
      >
        Ajustar valores →
      </Link>
    </div>
  );
}
