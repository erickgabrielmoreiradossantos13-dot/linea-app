"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { setDemoBusinessOverrides } from "@/lib/demo/store";

export interface SettingsInput {
  avgClientValue: number;
  closeRatePercent: number;
}

/**
 * El negocio a actualizar se resuelve siempre server-side a partir de la
 * sesión (nunca del ID que mande el cliente): así, aunque alguien llame a
 * esta action directamente con otro ID, la fila que se toca es siempre la
 * suya. RLS (`businesses_update_members`) es la última barrera, pero no la
 * única.
 */
export async function saveBusinessSettings(input: SettingsInput) {
  const closeRate = Math.min(1, Math.max(0, input.closeRatePercent / 100));
  const avgClientValue = Math.max(0, input.avgClientValue);

  if (IS_DEMO_MODE) {
    await setDemoBusinessOverrides({ avg_client_value: avgClientValue, close_rate: closeRate });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return;
  }

  const { business } = await getCurrentBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({ avg_client_value: avgClientValue, close_rate: closeRate })
    .eq("id", business.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}
