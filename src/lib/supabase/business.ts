import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { DEMO_BUSINESS, DEMO_EMAIL } from "@/lib/demo/data";
import { getDemoBusinessOverrides, hasDemoSession } from "@/lib/demo/store";
import { isLineaStaff } from "@/lib/staff";
import type { Business } from "@/lib/types";

export const STAFF_VIEW_COOKIE = "linea_staff_view_business_id";

export interface CurrentBusinessContext {
  userId: string;
  userEmail: string | null;
  role: "client" | "admin";
  business: Business;
  /** El usuario es staff de Línea Sur y está viendo este proyecto desde /dashboard/admin, no es su propio negocio. */
  isViewingAsStaff: boolean;
}

/**
 * Resuelve el negocio activo ("proyecto") del usuario autenticado.
 *
 * Además del negocio propio (membresía normal), el equipo de Línea Sur puede
 * "entrar" como cualquier cliente desde /dashboard/admin/sites: eso solo
 * marca una cookie con el business_id elegido. Aquí se valida SIEMPRE
 * server-side que quien la tenga sea realmente staff (nunca se confía en la
 * cookie por sí sola) antes de resolver ese negocio en vez del propio.
 */
export async function getCurrentBusiness(): Promise<CurrentBusinessContext> {
  if (IS_DEMO_MODE) {
    const active = await hasDemoSession();
    if (!active) {
      redirect("/login");
    }

    const overrides = await getDemoBusinessOverrides();

    return {
      userId: "demo-user",
      userEmail: DEMO_EMAIL,
      role: "admin",
      business: { ...DEMO_BUSINESS, ...overrides },
      isViewingAsStaff: false,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const viewBusinessId = (await cookies()).get(STAFF_VIEW_COOKIE)?.value;
  if (viewBusinessId) {
    const staff = await isLineaStaff();
    if (staff) {
      const { data: viewedBusiness } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", viewBusinessId)
        .maybeSingle();

      if (viewedBusiness) {
        return {
          userId: user.id,
          userEmail: user.email ?? null,
          role: "admin",
          business: viewedBusiness as Business,
          isViewingAsStaff: true,
        };
      }
    }
  }

  const { data: membership } = await supabase
    .from("business_members")
    .select("role, business:businesses(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership || !membership.business) {
    redirect("/login");
  }

  return {
    userId: user.id,
    userEmail: user.email ?? null,
    role: membership.role as "client" | "admin",
    business: membership.business as unknown as Business,
    isViewingAsStaff: false,
  };
}
