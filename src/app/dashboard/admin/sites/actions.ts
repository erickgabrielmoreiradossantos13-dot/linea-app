"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { isLineaStaff } from "@/lib/staff";
import { STAFF_VIEW_COOKIE } from "@/lib/supabase/business";

const VIEW_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 8,
};

/** Entra al panel de un cliente como staff de Línea Sur (no cambia de usuario, solo de proyecto activo). */
export async function viewAsBusinessAction(businessId: string) {
  const staff = await isLineaStaff();
  if (!staff) throw new Error("No autorizado.");

  (await cookies()).set(STAFF_VIEW_COOKIE, businessId, VIEW_COOKIE_OPTS);
  redirect("/dashboard");
}

export async function exitBusinessViewAction() {
  (await cookies()).delete(STAFF_VIEW_COOKIE);
  redirect("/dashboard/admin/sites");
}

export interface CreateSiteInput {
  businessId: string;
  name: string;
  domain: string;
  productionUrl: string;
  previewUrl: string;
  framework: string;
}

export async function createSite(input: CreateSiteInput) {
  if (IS_DEMO_MODE) {
    throw new Error("En modo demo no se pueden crear sitios nuevos (ya existe el de Clínica Aurora).");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("sites").insert({
    business_id: input.businessId,
    name: input.name,
    domain: input.domain || null,
    production_url: input.productionUrl || null,
    preview_url: input.previewUrl || null,
    framework: input.framework || "linea-nextjs",
    status: "draft",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/sites");
}
