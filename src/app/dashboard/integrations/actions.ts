"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { saveIntegrationSettings, type IntegrationInput } from "@/lib/integrations";

export async function saveIntegrationsAction(input: IntegrationInput): Promise<{ error: string | null }> {
  const { business } = await getCurrentBusiness();

  try {
    await saveIntegrationSettings(business.id, input);
  } catch {
    return { error: "No se pudo guardar la configuración. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/integrations");
  return { error: null };
}
