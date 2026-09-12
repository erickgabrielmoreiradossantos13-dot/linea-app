import { demoOrganization } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/features/session/context";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

export type OrganizationSettings = {
  id: string;
  name: string;
  slug: string;
  planCode: string;
  website: string | null;
};

export async function getOrganizationSettings(session: SessionContext): Promise<OrganizationSettings> {
  if (session.isDemo) {
    return {
      id: demoOrganization.id,
      name: demoOrganization.name,
      slug: demoOrganization.slug,
      planCode: demoOrganization.plan,
      website: "clinicadentalmalaga.es",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("id, name, slug, plan_code")
    .eq("id", session.organizationId)
    .maybeSingle();

  if (error || !organization) throw new Error("No se pudo carregar a organização.");

  const { data: website } = await supabase
    .from("websites")
    .select("domain")
    .eq("organization_id", session.organizationId)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    planCode: organization.plan_code,
    website: website?.domain ?? null,
  };
}

export type OrganizationMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Exclude<Role, "SUPER_ADMIN">;
  status: "INVITED" | "ACTIVE" | "SUSPENDED";
};

export async function getOrganizationMembers(session: SessionContext): Promise<OrganizationMember[]> {
  if (session.isDemo) {
    return [
      { id: "demo-owner", userId: "demo-user", name: "Equipo DEMO", email: "demo@lineasur.online", role: "OWNER", status: "ACTIVE" },
    ];
  }

  const supabase = await createSupabaseServerClient();
  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("id, user_id, role, status")
    .eq("organization_id", session.organizationId)
    .order("created_at");
  if (error) throw new Error("No se pudo cargar el equipo.");
  if (!memberships?.length) return [];

  const admin = createSupabaseAdminClient();
  const ids = memberships.map((member) => member.user_id);
  const [{ data: profiles }, authUsers] = await Promise.all([
    admin.from("profiles").select("id, full_name").in("id", ids),
    Promise.all(ids.map((id) => admin.auth.admin.getUserById(id))),
  ]);
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const users = new Map(authUsers.flatMap((result) => result.data.user ? [[result.data.user.id, result.data.user]] : []));

  return memberships.map((member) => {
    const user = users.get(member.user_id);
    return {
      id: member.id,
      userId: member.user_id,
      name: names.get(member.user_id) || String(user?.user_metadata?.full_name ?? "") || "Miembro",
      email: user?.email ?? "Email no disponible",
      role: member.role as Exclude<Role, "SUPER_ADMIN">,
      status: member.status as OrganizationMember["status"],
    };
  });
}
