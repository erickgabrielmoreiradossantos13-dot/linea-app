import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { DEMO_BUSINESS, DEMO_EMAIL } from "@/lib/demo/data";
import { getDemoBusinessOverrides, hasDemoSession } from "@/lib/demo/store";
import type { Business } from "@/lib/types";

export interface CurrentBusinessContext {
  userId: string;
  userEmail: string | null;
  role: "client" | "admin";
  business: Business;
}

/**
 * Resuelve el negocio del usuario autenticado. El middleware ya protege
 * /dashboard, así que si llegamos aquí sin sesión o sin membresía,
 * es un estado inconsistente y volvemos a /login.
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
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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
  };
}
