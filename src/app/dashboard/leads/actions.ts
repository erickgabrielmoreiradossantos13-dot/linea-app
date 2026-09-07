"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { setDemoLeadOverride } from "@/lib/demo/store";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  if (!LEAD_STATUSES.includes(status)) {
    throw new Error("Estado de lead no válido");
  }

  if (IS_DEMO_MODE) {
    await setDemoLeadOverride(leadId, status);
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard");
    return;
  }

  // Se acota explícitamente por el negocio de la sesión (además de RLS): así
  // un lead_id de otro negocio nunca se actualiza, en vez de depender solo
  // de que la policy lo bloquee en silencio.
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId)
    .eq("business_id", business.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
}
