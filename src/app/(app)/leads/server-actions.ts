"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionContext } from "@/features/session/context";
import { requireFeature } from "@/lib/features";
import { can } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/lib/types";

type ActionResult = { error?: string; success?: string };

const statusSchema = z.enum(["NEW", "CONTACTED", "QUALIFIED", "MEETING", "PROPOSAL", "WON", "LOST"]);

const createLeadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  source: z.string().trim().min(1).max(80),
  message: z.string().trim().max(4000).optional(),
});

const leadDetailsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  source: z.string().trim().min(1).max(80),
  message: z.string().trim().max(4000).optional(),
});

async function requireLeadAdmin() {
  const session = await getSessionContext();
  requireFeature(session, "leads");
  if (!can(session.role, "ADMIN")) return { error: "Sin permiso para editar contactos." } as const;
  if (session.isDemo) return { error: "La demostración no guarda cambios. Activa tu espacio para trabajar con datos reales." } as const;
  return { session, supabase: await createSupabaseServerClient() } as const;
}

export async function createLeadAction(formData: FormData): Promise<ActionResult> {
  const access = await requireLeadAdmin();
  if ("error" in access) return access;

  const parsed = createLeadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    source: formData.get("source"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: "Revisa el nombre, email y origen del contacto." };

  const { error } = await access.supabase.from("leads").insert({
    organization_id: access.session.organizationId,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    source: parsed.data.source,
    message: parsed.data.message || null,
    status: "NEW",
    page_path: "manual",
    created_by: access.session.userId,
  });

  if (error) return { error: "No se pudo crear el contacto." };
  revalidatePath("/leads");
  redirect("/leads");
}

export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<ActionResult> {
  const parsed = z.object({ leadId: z.string().uuid(), status: statusSchema }).safeParse({ leadId, status });
  if (!parsed.success) return { error: "Estado de contacto no válido." };
  const access = await requireLeadAdmin();
  if ("error" in access) return access;

  const { data: lead, error } = await access.supabase
    .from("leads")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.leadId)
    .eq("organization_id", access.session.organizationId)
    .select("id")
    .maybeSingle();

  if (error || !lead) return { error: "No se pudo actualizar el contacto." };

  await access.supabase.from("audit_logs").insert({
    organization_id: access.session.organizationId,
    actor_user_id: access.session.userId,
    action: "lead.status_updated",
    target_type: "lead",
    target_id: lead.id,
    metadata: { status: parsed.data.status },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/dashboard");
  return { success: "Estado actualizado." };
}

export async function updateLeadDetails(formData: FormData): Promise<ActionResult> {
  const parsed = leadDetailsSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    source: formData.get("source"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: "Revisa los datos del contacto." };
  const access = await requireLeadAdmin();
  if ("error" in access) return access;

  const { data: lead, error } = await access.supabase
    .from("leads")
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      company: parsed.data.company || null,
      source: parsed.data.source,
      message: parsed.data.message || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("organization_id", access.session.organizationId)
    .select("id")
    .maybeSingle();

  if (error || !lead) return { error: "No se pudieron guardar los datos del contacto." };
  revalidatePath("/leads");
  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/dashboard");
  return { success: "Datos del contacto actualizados." };
}

export async function addLeadNote(leadId: string, note: string): Promise<ActionResult> {
  const parsed = z.object({ leadId: z.string().uuid(), note: z.string().trim().min(1).max(5000) }).safeParse({ leadId, note });
  if (!parsed.success) return { error: "Escribe una nota de hasta 5.000 caracteres." };
  const access = await requireLeadAdmin();
  if ("error" in access) return access;

  const { data: lead, error: leadError } = await access.supabase
    .from("leads")
    .select("id")
    .eq("id", parsed.data.leadId)
    .eq("organization_id", access.session.organizationId)
    .maybeSingle();
  if (leadError || !lead) return { error: "Contacto no disponible en esta organización." };

  const { error } = await access.supabase.from("lead_notes").insert({
    organization_id: access.session.organizationId,
    lead_id: lead.id,
    author_id: access.session.userId,
    note: parsed.data.note,
  });
  if (error) return { error: "No se pudo guardar la nota." };

  revalidatePath(`/leads/${lead.id}`);
  return { success: "Nota añadida." };
}

export async function updateLeadAction(formData: FormData): Promise<ActionResult> {
  const parsed = z.object({
    id: z.string().uuid(),
    status: statusSchema,
    note: z.string().trim().max(5000).optional(),
  }).safeParse({ id: formData.get("id"), status: formData.get("status"), note: formData.get("note") });
  if (!parsed.success) return { error: "Revisa el estado y la nota del contacto." };

  const statusResult = await updateLeadStatus(parsed.data.id, parsed.data.status);
  if (statusResult.error) return statusResult;
  if (parsed.data.note) {
    const noteResult = await addLeadNote(parsed.data.id, parsed.data.note);
    if (noteResult.error) return noteResult;
  }
  return { success: parsed.data.note ? "Seguimiento y nota guardados." : "Seguimiento guardado." };
}
