"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionContext } from "@/features/session/context";
import { requireFeature } from "@/lib/features";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  subject: z.string().trim().min(4).max(180),
  description: z.string().trim().min(10).max(5000),
  priority: z.enum(["LOW","NORMAL","HIGH","URGENT"]),
});

export async function createTicketAction(formData: FormData) {
  const session = await getSessionContext();
  requireFeature(session, "support");
  const parsed = schema.safeParse({
    subject: formData.get("subject"),
    description: formData.get("description"),
    priority: formData.get("priority"),
  });
  if (!parsed.success) return { error: "Escribe un asunto de al menos 4 caracteres y una descripción de al menos 10." };
  if (session.isDemo) return { error: "La demostración no guarda cambios. Activa tu espacio para trabajar con datos reales." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("support_tickets").insert({
    organization_id: session.organizationId,
    created_by: session.userId,
    subject: parsed.data.subject,
    description: parsed.data.description,
    priority: parsed.data.priority,
    status: "OPEN",
  });
  if (error) return { error: "No se pudo crear la solicitud." };
  revalidatePath("/support");
  return { success: "Cambios guardados." };
}
