"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertSuperAdmin } from "@/features/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  responseNote: z.string().trim().max(5000).optional(),
});

export async function updateSupportTicket(formData: FormData) {
  const parsed = schema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    responseNote: formData.get("responseNote"),
  });
  if (!parsed.success) return { error: "Revisa el estado, la prioridad y la nota." };

  let session;
  try {
    session = await assertSuperAdmin();
  } catch {
    return { error: "Solo un Super Admin puede actualizar solicitudes." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: current, error: currentError } = await supabase
    .from("support_tickets")
    .select("id, organization_id")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (currentError || !current) return { error: "Solicitud no encontrada." };

  const now = new Date().toISOString();
  const responseNote = parsed.data.responseNote || null;
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .update({
      status: parsed.data.status,
      priority: parsed.data.priority,
      response_note: responseNote,
      responded_by: responseNote || parsed.data.status === "RESOLVED" ? session.userId : null,
      responded_at: responseNote || parsed.data.status === "RESOLVED" ? now : null,
      updated_at: now,
    })
    .eq("id", current.id)
    .eq("organization_id", current.organization_id)
    .select("id")
    .maybeSingle();
  if (error || !ticket) return { error: "No se pudo actualizar la solicitud." };

  await supabase.from("audit_logs").insert({
    organization_id: current.organization_id,
    actor_user_id: session.userId,
    action: "support_ticket.updated",
    target_type: "support_ticket",
    target_id: ticket.id,
    metadata: { status: parsed.data.status, priority: parsed.data.priority, response_added: Boolean(responseNote) },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/support");
  revalidatePath("/support");
  return { success: parsed.data.status === "RESOLVED" ? "Solicitud marcada como entregada." : "Solicitud actualizada." };
}
