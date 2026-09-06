import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { AttributionBreakdown } from "@/lib/leads";

function Bar({ items }: { items: AttributionBreakdown[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-400">Todavía no hay contactos para mostrar el origen.</p>;
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-ink-700">{item.label}</span>
            <span className="tabular-nums text-ink-400">
              {formatNumber(item.count)} · {formatPercent(item.share)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(item.share * 100, 2)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AttributionPanel({
  bySource,
  byLandingPage,
}: {
  bySource: AttributionBreakdown[];
  byLandingPage: AttributionBreakdown[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>De dónde llegan tus contactos</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar items={bySource} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Páginas que generan más contactos</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar items={byLandingPage} />
        </CardContent>
      </Card>
    </div>
  );
}
