"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";

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
