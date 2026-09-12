import { AppShell } from "@/components/app-shell";
import { getSessionContext } from "@/features/session/context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();
  return <AppShell session={session}>{children}</AppShell>;
}
