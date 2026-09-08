"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { createSupportRequest, addSupportComment } from "@/lib/support";
import { isLineaStaff } from "@/lib/staff";
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

export async function addSupportCommentAction(
  requestId: string,
  comment: string
): Promise<{ error: string | null }> {
  const trimmed = comment.trim();
  if (!trimmed) {
    return { error: "Escribe algo antes de enviar." };
  }

  const { business, userEmail } = await getCurrentBusiness();
  const staff = await isLineaStaff();

  try {
    await addSupportComment(business.id, requestId, trimmed, userEmail, staff);
  } catch {
    return { error: "No se pudo enviar el comentario. Inténtalo de nuevo." };
  }

  revalidatePath(`/dashboard/support/${requestId}`);
  return { error: null };
}
