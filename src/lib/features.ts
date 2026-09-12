import { notFound } from "next/navigation";
import type { SessionContext } from "@/features/session/context";

export function hasFeature(session: SessionContext, feature: string) {
  return session.role === "SUPER_ADMIN" || session.features[feature] === true;
}

export function requireFeature(session: SessionContext, feature: string) {
  if (!hasFeature(session, feature)) notFound();
}
