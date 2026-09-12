import { getSessionContext } from "@/features/session/context";
import { canViewAdmin } from "@/lib/authz";

export async function assertSuperAdmin() {
  const session = await getSessionContext();
  if (!canViewAdmin(session.role) || session.isDemo) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
