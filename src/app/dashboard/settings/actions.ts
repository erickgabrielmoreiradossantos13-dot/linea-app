"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { setDemoBusinessOverrides } from "@/lib/demo/store";

export interface SettingsInput {
  businessId: string;
  avgClientValue: number;
  closeRatePercent: number;
}

export async function saveBusinessSettings(input: SettingsInput) {
  const closeRate = Math.min(1, Math.max(0, input.closeRatePercent / 100));
  const avgClientValue = Math.max(0, input.avgClientValue);

  if (IS_DEMO_MODE) {
    await setDemoBusinessOverrides({ avg_client_value: avgClientValue, close_rate: closeRate });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({ avg_client_value: avgClientValue, close_rate: closeRate })
    .eq("id", input.businessId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}
