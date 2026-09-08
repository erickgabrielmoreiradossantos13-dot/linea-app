"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { setDemoLeadOverride } from "@/lib/demo/store";
import { addLeadNote, createLead } from "@/lib/leads";
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

export async function addLeadNoteAction(leadId: string, note: string): Promise<{ error: string | null }> {
  const trimmed = note.trim();
  if (!trimmed) {
    return { error: "Escribe algo antes de guardar la nota." };
  }
  if (trimmed.length > 2000) {
    return { error: "La nota es demasiado larga (máximo 2000 caracteres)." };
  }

  const { business } = await getCurrentBusiness();
  try {
    await addLeadNote(business.id, leadId, trimmed);
  } catch {
    return { error: "No se pudo guardar la nota. Inténtalo de nuevo." };
  }

  revalidatePath(`/dashboard/leads/${leadId}`);
  return { error: null };
}

export interface CreateLeadFormInput {
  name: string;
  phone: string;
  email: string;
  service: string;
  status: LeadStatus;
  valueEstimate: string;
}

export async function createLeadAction(input: CreateLeadFormInput): Promise<{ error: string | null }> {
  const name = input.name.trim();
  if (!name) {
    return { error: "El nombre es obligatorio." };
  }
  if (!LEAD_STATUSES.includes(input.status)) {
    return { error: "Estado no válido." };
  }

  const value = Number.parseFloat(input.valueEstimate.replace(",", "."));

  const { business } = await getCurrentBusiness();
  try {
    await createLead(business.id, {
      name,
      phone: input.phone.trim() || null,
      email: input.email.trim() || null,
      service: input.service.trim() || null,
      status: input.status,
      value_estimate: Number.isNaN(value) ? 0 : Math.max(0, value),
    });
  } catch {
    return { error: "No se pudo crear el contacto. Inténtalo de nuevo." };
  }

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
  return { error: null };
}
