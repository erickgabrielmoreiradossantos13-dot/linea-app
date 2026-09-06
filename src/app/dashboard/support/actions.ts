"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { createSupportRequest } from "@/lib/support";
import type { SupportCategory, SupportPriority } from "@/lib/types";

export async function createSupportRequestAction(input: {
  title: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
}): Promise<{ error: string | null }> {
  if (!input.title.trim() || !input.description.trim()) {
    return { error: "Completa el título y la descripción." };
  }

  const { business } = await getCurrentBusiness();

  try {
    await createSupportRequest(business.id, input);
  } catch {
    return { error: "No se pudo enviar la solicitud. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/support");
  return { error: null };
}
