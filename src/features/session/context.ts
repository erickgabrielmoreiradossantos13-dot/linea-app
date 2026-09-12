import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { demoOrganization } from "@/lib/demo-data";
import type { Role } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionOrganization = {
  id: string;
  name: string;
  role: Role;
};

export type SessionContext = {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  organizations: SessionOrganization[];
  role: Role;
  features: Record<string, boolean>;
  isDemo: boolean;
};

const ADMIN_FALLBACK_ORG = "00000000-0000-0000-0000-000000000000";

const GROWTH_FEATURES: Record<string, boolean> = {
  dashboard: true, leads: true, site: true, content: true,
  media: true, analytics: true, seo: true, support: true,
};

const ADMIN_FEATURES = new Proxy({}, { get: () => true }) as Record<string, boolean>;

async function getPlanFeatures(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  planCode?: string
) {
  if (!planCode) return {};
  const { data: plan } = await supabase.from("plans").select("features").eq("code", planCode).maybeSingle();
  if (plan?.features && typeof plan.features === "object" && !Array.isArray(plan.features)) {
    return plan.features as Record<string, boolean>;
  }
  return {};
}

export async function getSessionContext(): Promise<SessionContext> {
  if (isDemoMode) {
    return {
      userId: "demo-user",
      email: "demo@lineasur.online",
      organizationId: demoOrganization.id,
      organizationName: demoOrganization.name,
      organizations: [{ id: demoOrganization.id, name: demoOrganization.name, role: "OWNER" }],
      role: "OWNER",
      features: GROWTH_FEATURES,
      isDemo: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, cookieStore] = await Promise.all([
    supabase.from("profiles").select("is_super_admin").eq("id", user.id).maybeSingle(),
    cookies(),
  ]);
  const selectedOrganizationId = cookieStore.get("linea_org")?.value;

  if (profile?.is_super_admin) {
    const { data: orgRows, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, plan_code")
      .is("deleted_at", null)
      .order("name");
    if (orgError) throw new Error("No se pudo carregar as organizacciones.");

    const organizations: SessionOrganization[] = (orgRows ?? []).map((org) => ({
      id: org.id, name: org.name, role: "SUPER_ADMIN",
    }));
    const selected = (orgRows ?? []).find((org) => org.id === selectedOrganizationId) ?? orgRows?.[0] ?? null;

    return {
      userId: user.id,
      email: user.email ?? "",
      organizationId: selected?.id ?? ADMIN_FALLBACK_ORG,
      organizationName: selected?.name ?? "Línea Sur Admin",
      organizations,
      role: "SUPER_ADMIN",
      features: ADMIN_FEATURES,
      isDemo: false,
    };
  }

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(name, plan_code)")
    .eq("user_id", user.id)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: true });

  if (error || !memberships || memberships.length === 0) redirect("/onboarding");

  const normalized = memberships.map((membership) => {
    const organization = membership.organizations as unknown as { name: string; plan_code: string } | null;
    return {
      id: membership.organization_id,
      name: organization?.name ?? "Organización",
      role: membership.role as Role,
      planCode: organization?.plan_code,
    };
  });

  const selected = normalized.find((org) => org.id === selectedOrganizationId) ?? normalized[0];
  const features = await getPlanFeatures(supabase, selected.planCode);

  return {
    userId: user.id,
    email: user.email ?? "",
    organizationId: selected.id,
    organizationName: selected.name,
    organizations: normalized.map(({ id, name, role }) => ({ id, name, role })),
    role: selected.role,
    features,
    isDemo: false,
  };
}
