import type { LeadStatus } from "@/lib/types";

const labels: Record<LeadStatus, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUALIFIED: "Cualificado",
  MEETING: "Reunión",
  PROPOSAL: "Propuesta",
  WON: "Ganado",
  LOST: "Perdido",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className="badge" data-status={status}>{labels[status]}</span>;
}
