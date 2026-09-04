import { formatNumber } from "@/lib/utils";

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

interface GreetingHeaderProps {
  businessName: string;
  opportunities: number;
}

export function GreetingHeader({ businessName, opportunities }: GreetingHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight text-ink-900">
        {getGreeting()}, {businessName}
      </h1>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-500">
        Tu presencia digital generó{" "}
        <span className="font-semibold text-ink-900">{formatNumber(opportunities)} oportunidades comerciales</span>{" "}
        en los últimos 30 días.
      </p>
    </div>
  );
}
