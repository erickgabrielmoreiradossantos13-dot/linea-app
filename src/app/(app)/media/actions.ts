"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/features/session/context";
import { requireFeature } from "@/lib/features";
import { canEditContent } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import sharp from "sharp";
import { isSupportedImageMime, mimeForPath } from "@/lib/mime";

const maxBytes = 12 * 1024 * 1024;

export async function uploadMediaAction(formData: FormData) {
  const session = await getSessionContext();
  requireFeature(session, "media");
  if (!canEditContent(session.role)) return { error: "Sin permiso para subir imágenes." };
  if (session.isDemo) return { error: "La demostración no guarda cambios. Activa tu espacio para trabajar con datos reales." };

  const file = formData.get("file");
  const altText = String(formData.get("altText") ?? "").trim();
  if (!(file instanceof File)) return { error: "Selecciona un archivo de imagen." };
  if (!isSupportedImageMime(file.type) || mimeForPath(file.name) !== file.type) return { error: "Usa una imagen JPEG, PNG, WebP o AVIF válida." };
  if (file.size <= 0 || file.size > maxBytes) return { error: "La imagen debe tener entre 1 byte y 12 MB." };

  const storagePath = `${session.organizationId}/${randomUUID()}.webp`;
  const supabase = await createSupabaseServerClient();
  let bytes: Buffer;
  try {
    bytes = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch {
    return { error: "No pudimos procesar esta imagen." };
  }

  const { error: uploadError } = await supabase.storage.from("media").upload(storagePath, bytes, {
    contentType: "image/webp",
    upsert: false,
  });
  if (uploadError) return { error: "No se pudo subir la imagen." };

  const { data: website } = await supabase.from("websites").select("id").eq("organization_id", session.organizationId).eq("status", "ACTIVE").limit(1).maybeSingle();
  const { error: recordError } = await supabase.from("media").insert({
    organization_id: session.organizationId,
    website_id: website?.id ?? null,
    storage_path: storagePath,
    filename: `${file.name.replace(/\.[^.]+$/, "").slice(0, 240)}.webp`,
    mime_type: "image/webp",
    bytes: bytes.byteLength,
    alt_text: altText || null,
    created_by: session.userId,
  });

  if (recordError) {
    await supabase.storage.from("media").remove([storagePath]);
    return { error: "No se pudo guardar la imagen. El archivo se ha retirado; vuelve a intentarlo." };
  }

  revalidatePath("/media");
  return { success: `Imagen optimizada a WebP (${Math.max(1, Math.round(bytes.byteLength / 1024))} KB).` };
}

export async function updateMediaAltAction(formData: FormData) {
  const parsed = z.object({ id: z.string().uuid(), altText: z.string().trim().max(500) }).safeParse({
    id: formData.get("id"),
    altText: formData.get("altText"),
  });
  if (!parsed.success) return { error: "Revisa el texto alternativo." };
  const session = await getSessionContext();
  requireFeature(session, "media");
  if (!canEditContent(session.role)) return { error: "Sin permiso para editar imágenes." };
  if (session.isDemo) return { error: "La demostración no guarda cambios." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("media")
    .update({ alt_text: parsed.data.altText || null })
    .eq("id", parsed.data.id)
    .eq("organization_id", session.organizationId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "No se pudo actualizar una imagen de esta organización." };
  revalidatePath("/media");
  return { success: "Texto alternativo actualizado." };
}

export async function archiveMediaAction(formData: FormData) {
  const parsed = z.string().uuid().safeParse(formData.get("id"));
  if (!parsed.success) return { error: "Imagen no válida." };
  const session = await getSessionContext();
  requireFeature(session, "media");
  if (!canEditContent(session.role)) return { error: "Sin permiso para retirar imágenes." };
  if (session.isDemo) return { error: "La demostración no guarda cambios." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("media")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("organization_id", session.organizationId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "No se pudo retirar una imagen de esta organización." };
  revalidatePath("/media");
  return { success: "Imagen retirada de la biblioteca." };
}
