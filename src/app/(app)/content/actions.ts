"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionContext } from "@/features/session/context";
import { requireFeature } from "@/lib/features";
import { canEditContent } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult = { error?: string; success?: string };

const updateSchema = z.object({
  id: z.string().uuid(),
  value: z.string().max(20000),
});

const createSchema = z.object({
  websiteId: z.string().uuid(),
  contentKey: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/i),
  label: z.string().trim().min(2).max(180),
  value: z.string().max(20000),
  kind: z.enum(["text", "rich_text", "url", "phone", "email"]),
});

async function requireContentEditor() {
  const session = await getSessionContext();
  requireFeature(session, "content");
  if (!canEditContent(session.role)) return { error: "Sin permiso para editar contenido." } as const;
  if (session.isDemo) return { error: "La demostración no guarda cambios. Activa tu espacio para trabajar con datos reales." } as const;
  return { session, supabase: await createSupabaseServerClient() } as const;
}

export async function updateContentEntry(formData: FormData): Promise<ActionResult> {
  const parsed = updateSchema.safeParse({ id: formData.get("id"), value: formData.get("value") });
  if (!parsed.success) return { error: "El contenido no es válido." };
  const access = await requireContentEditor();
  if ("error" in access) return access;

  const { data: entry, error } = await access.supabase
    .from("content_entries")
    .update({
      draft_value: parsed.data.value,
      has_unpublished_changes: true,
      updated_by: access.session.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("organization_id", access.session.organizationId)
    .select("id, website_id, content_key")
    .maybeSingle();

  if (error || !entry) return { error: "No se pudo guardar un contenido de esta organización." };

  revalidatePath("/content");
  revalidatePath(`/site/${entry.website_id}/edit`);
  return { success: "Borrador guardado." };
}

export async function createContentEntry(formData: FormData): Promise<ActionResult> {
  const parsed = createSchema.safeParse({
    websiteId: formData.get("websiteId"),
    contentKey: formData.get("contentKey"),
    label: formData.get("label"),
    value: formData.get("value"),
    kind: formData.get("kind"),
  });
  if (!parsed.success) return { error: "Revisa la clave, la etiqueta, el tipo y el contenido." };
  const access = await requireContentEditor();
  if ("error" in access) return access;

  const { data: website, error: websiteError } = await access.supabase
    .from("websites")
    .select("id")
    .eq("id", parsed.data.websiteId)
    .eq("organization_id", access.session.organizationId)
    .maybeSingle();
  if (websiteError || !website) return { error: "Web no disponible en esta organización." };

  const { data: entry, error } = await access.supabase
    .from("content_entries")
    .insert({
      organization_id: access.session.organizationId,
      website_id: website.id,
      content_key: parsed.data.contentKey,
      label: parsed.data.label,
      value: null,
      draft_value: parsed.data.value,
      has_unpublished_changes: true,
      kind: parsed.data.kind,
      updated_by: access.session.userId,
    })
    .select("id")
    .single();
  if (error || !entry) return { error: "No se pudo crear el contenido. Comprueba que la clave no exista." };

  revalidatePath("/content");
  revalidatePath(`/site/${website.id}/edit`);
  return { success: "Contenido añadido al borrador." };
}

export async function updateContentAction(formData: FormData) {
  return updateContentEntry(formData);
}
