"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { z } from "zod";
import { getSessionContext } from "@/features/session/context";
import type { BlockConfig, BlockType } from "@/features/editor/types";
import { can, canEditContent } from "@/lib/authz";
import { requireFeature } from "@/lib/features";
import { isSupportedImageMime, mimeForPath } from "@/lib/mime";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EditorActionResult = {
  error?: string;
  success?: string;
  requiresConfirmation?: boolean;
  warnings?: string[];
};

async function requireEditor() {
  const session = await getSessionContext();
  requireFeature(session, "content");
  if (!canEditContent(session.role)) return { error: "Tu perfil es de solo lectura." } as const;
  if (session.isDemo) return { error: "La demostración permite explorar el editor, pero no guarda cambios." } as const;
  return { session, supabase: await createSupabaseServerClient() } as const;
}

async function requirePublisher() {
  const access = await requireEditor();
  if ("error" in access) return access;
  if (!can(access.session.role, "ADMIN")) return { error: "Solo OWNER y ADMIN pueden publicar." } as const;
  return access;
}

function refreshEditor(websiteId: string) {
  revalidatePath(`/site/${websiteId}/edit`);
  revalidatePath("/site");
  revalidatePath("/content");
  revalidatePath("/seo");
  revalidatePath(`/sites/${websiteId}`, "layout");
}

async function ownedPage(access: Exclude<Awaited<ReturnType<typeof requireEditor>>, { error: string }>, pageId: string) {
  const { data, error } = await access.supabase.from("pages").select("id, website_id")
    .eq("id", pageId).eq("organization_id", access.session.organizationId).maybeSingle();
  return error ? null : data;
}

async function ownedBlock(access: Exclude<Awaited<ReturnType<typeof requireEditor>>, { error: string }>, blockId: string) {
  const { data, error } = await access.supabase.from("page_blocks")
    .select("id, website_id, page_id, position, type, draft_config")
    .eq("id", blockId).eq("organization_id", access.session.organizationId).maybeSingle();
  return error ? null : data;
}

function blockDefaults(type: BlockType, isFirst: boolean): { config: BlockConfig; entries: { suffix: string; label: string; value: string; kind: string }[] } {
  if (type === "text") return {
    config: { eyebrow: isFirst ? "Tu negocio, bien presentado" : "Una idea importante", headingLevel: isFirst ? "h1" : "h2", tone: isFirst ? "accent" : "light" },
    entries: [
      { suffix: "heading", label: "Título", value: isFirst ? "Un título que explica por qué elegirte" : "Cuenta aquí lo que te hace diferente", kind: "text" },
      { suffix: "body", label: "Texto", value: "Haz clic en este texto para editarlo directamente dentro de la página.", kind: "rich_text" },
    ],
  };
  if (type === "image_text") return {
    config: { headingLevel: "h2", imagePosition: "left" },
    entries: [
      { suffix: "heading", label: "Título", value: "Una imagen que apoya tu historia", kind: "text" },
      { suffix: "body", label: "Texto", value: "Combina una fotografía de tu negocio con un mensaje claro y cercano.", kind: "rich_text" },
    ],
  };
  if (type === "cards") return {
    config: { headingLevel: "h2", items: [
      { id: randomUUID(), title: "Beneficio principal", body: "Explica el valor concreto para tu cliente." },
      { id: randomUUID(), title: "Proceso sencillo", body: "Resume cómo trabajáis en pocas palabras." },
      { id: randomUUID(), title: "Acompañamiento", body: "Da confianza antes del primer contacto." },
    ] },
    entries: [{ suffix: "heading", label: "Título", value: "Razones para contar con nosotros", kind: "text" }],
  };
  return {
    config: { headingLevel: "h2", tone: "accent" },
    entries: [
      { suffix: "heading", label: "Título", value: "¿Hablamos de tu proyecto?", kind: "text" },
      { suffix: "body", label: "Texto", value: "Cuéntanos qué necesitas y te responderemos con una propuesta clara.", kind: "rich_text" },
      { suffix: "button_label", label: "Texto del botón", value: "Contactar", kind: "text" },
      { suffix: "button_url", label: "Enlace del botón", value: "#contacto", kind: "url" },
    ],
  };
}

async function insertBlock(
  access: Exclude<Awaited<ReturnType<typeof requireEditor>>, { error: string }>,
  page: { id: string; website_id: string }, type: BlockType, position: number,
) {
  const defaults = blockDefaults(type, position === 0);
  const { data: block, error } = await access.supabase.from("page_blocks").insert({
    organization_id: access.session.organizationId, website_id: page.website_id, page_id: page.id,
    type, position, config: {}, draft_config: defaults.config, draft_visible: true,
    has_unpublished_changes: true, updated_by: access.session.userId,
  }).select("id").single();
  if (error || !block) return null;
  const prefix = `page.${page.id}.block.${block.id}`;
  const { error: entriesError } = await access.supabase.from("content_entries").insert(defaults.entries.map((entry) => ({
    organization_id: access.session.organizationId, website_id: page.website_id, page_id: page.id, block_id: block.id,
    content_key: `${prefix}.${entry.suffix}`, label: entry.label, kind: entry.kind,
    value: null, draft_value: entry.value, has_unpublished_changes: true, updated_by: access.session.userId,
  })));
  if (entriesError) return null;
  await access.supabase.from("pages").update({ has_unpublished_changes: true, updated_at: new Date().toISOString() })
    .eq("id", page.id).eq("organization_id", access.session.organizationId);
  return block.id;
}

export async function initializeWebsiteEditor(formData: FormData): Promise<EditorActionResult> {
  const parsed = z.string().uuid().safeParse(formData.get("websiteId"));
  if (!parsed.success) return { error: "Web no válida." };
  const access = await requireEditor();
  if ("error" in access) return access;
  const { data: website } = await access.supabase.from("websites").select("id")
    .eq("id", parsed.data).eq("organization_id", access.session.organizationId).maybeSingle();
  if (!website) return { error: "Web no disponible en esta organización." };
  const { data: existing } = await access.supabase.from("pages").select("id").eq("website_id", website.id)
    .eq("organization_id", access.session.organizationId).limit(1);
  if (existing?.length) return { success: "El editor ya está preparado." };
  const { data: page, error } = await access.supabase.from("pages").insert({
    organization_id: access.session.organizationId, website_id: website.id, path: "/", title: "Inicio",
    meta_description: null, is_indexable: true, draft_title: "Inicio", draft_meta_description: null,
    draft_is_indexable: true, has_unpublished_changes: true,
  }).select("id, website_id").single();
  if (error || !page) return { error: "No se pudo crear la página inicial." };
  if (!await insertBlock(access, page, "text", 0)) return { error: "La página se creó, pero no pudimos preparar su primer bloque." };
  refreshEditor(website.id);
  return { success: "Editor preparado." };
}

export async function saveContentDraft(input: { entryId: string; value: string }): Promise<EditorActionResult> {
  const parsed = z.object({ entryId: z.string().uuid(), value: z.string().max(20000) }).safeParse(input);
  if (!parsed.success) return { error: "El contenido no es válido." };
  const access = await requireEditor();
  if ("error" in access) return access;
  const { data, error } = await access.supabase.from("content_entries").update({
    draft_value: parsed.data.value, has_unpublished_changes: true,
    updated_by: access.session.userId, updated_at: new Date().toISOString(),
  }).eq("id", parsed.data.entryId).eq("organization_id", access.session.organizationId)
    .select("id, website_id, page_id").maybeSingle();
  if (error || !data) return { error: "No se pudo guardar este texto." };
  if (data.page_id) await access.supabase.from("pages").update({ has_unpublished_changes: true })
    .eq("id", data.page_id).eq("organization_id", access.session.organizationId);
  return { success: "Borrador guardado." };
}

export async function saveBlockDraftConfig(input: { blockId: string; config: BlockConfig }): Promise<EditorActionResult> {
  const parsed = z.object({ blockId: z.string().uuid(), config: z.record(z.string(), z.unknown()) }).safeParse(input);
  if (!parsed.success) return { error: "La configuración del bloque no es válida." };
  const access = await requireEditor();
  if ("error" in access) return access;
  const config = { ...parsed.data.config };
  delete config.imageUrl;
  delete config.imageAlt;
  const { data, error } = await access.supabase.from("page_blocks").update({
    draft_config: config, has_unpublished_changes: true, updated_by: access.session.userId, updated_at: new Date().toISOString(),
  }).eq("id", parsed.data.blockId).eq("organization_id", access.session.organizationId)
    .select("id, website_id, page_id").maybeSingle();
  if (error || !data) return { error: "No se pudo guardar este bloque." };
  await access.supabase.from("pages").update({ has_unpublished_changes: true })
    .eq("id", data.page_id).eq("organization_id", access.session.organizationId);
  return { success: "Borrador guardado." };
}

export async function savePageSeoDraft(input: { pageId: string; title: string; metaDescription: string; isIndexable: boolean }): Promise<EditorActionResult> {
  const parsed = z.object({ pageId: z.string().uuid(), title: z.string().trim().min(2).max(180), metaDescription: z.string().trim().max(320), isIndexable: z.boolean() }).safeParse(input);
  if (!parsed.success) return { error: "Revisa el título y la descripción de la página." };
  const access = await requireEditor();
  if ("error" in access) return access;
  const { data, error } = await access.supabase.from("pages").update({
    draft_title: parsed.data.title, draft_meta_description: parsed.data.metaDescription || null,
    draft_is_indexable: parsed.data.isIndexable, has_unpublished_changes: true, updated_at: new Date().toISOString(),
  }).eq("id", parsed.data.pageId).eq("organization_id", access.session.organizationId).select("website_id").maybeSingle();
  if (error || !data) return { error: "No se pudo guardar la configuración de esta página." };
  return { success: "Borrador guardado." };
}

export async function addBlock(input: { pageId: string; type: BlockType }): Promise<EditorActionResult> {
  const parsed = z.object({ pageId: z.string().uuid(), type: z.enum(["text", "image_text", "cards", "cta"]) }).safeParse(input);
  if (!parsed.success) return { error: "Bloque no válido." };
  const access = await requireEditor();
  if ("error" in access) return access;
  const page = await ownedPage(access, parsed.data.pageId);
  if (!page) return { error: "Página no disponible en esta organización." };
  const { data: last } = await access.supabase.from("page_blocks").select("position")
    .eq("page_id", page.id).eq("organization_id", access.session.organizationId).eq("draft_visible", true)
    .order("position", { ascending: false }).limit(1).maybeSingle();
  if (!await insertBlock(access, page, parsed.data.type, (last?.position ?? -1) + 1)) return { error: "No se pudo añadir el bloque." };
  refreshEditor(page.website_id);
  return { success: "Bloque añadido al borrador." };
}

export async function moveBlock(input: { blockId: string; direction: "up" | "down" }): Promise<EditorActionResult> {
  const parsed = z.object({ blockId: z.string().uuid(), direction: z.enum(["up", "down"]) }).safeParse(input);
  if (!parsed.success) return { error: "Movimiento no válido." };
  const access = await requireEditor();
  if ("error" in access) return access;
  const block = await ownedBlock(access, parsed.data.blockId);
  if (!block) return { error: "Bloque no disponible." };
  const { data: rows } = await access.supabase.from("page_blocks").select("id, position")
    .eq("page_id", block.page_id).eq("organization_id", access.session.organizationId).eq("draft_visible", true).order("position");
  const index = (rows ?? []).findIndex((row) => row.id === block.id);
  const target = parsed.data.direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= (rows?.length ?? 0)) return { success: "El bloque ya está en el límite." };
  const reordered = [...(rows ?? [])];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  await Promise.all(reordered.map((row, position) => access.supabase.from("page_blocks").update({ position, has_unpublished_changes: true, updated_by: access.session.userId })
    .eq("id", row.id).eq("organization_id", access.session.organizationId)));
  await access.supabase.from("pages").update({ has_unpublished_changes: true }).eq("id", block.page_id).eq("organization_id", access.session.organizationId);
  refreshEditor(block.website_id);
  return { success: "Orden actualizado." };
}

export async function duplicateBlock(blockId: string): Promise<EditorActionResult> {
  const parsed = z.string().uuid().safeParse(blockId);
  if (!parsed.success) return { error: "Bloque no válido." };
  const access = await requireEditor();
  if ("error" in access) return access;
  const block = await ownedBlock(access, parsed.data);
  if (!block) return { error: "Bloque no disponible." };
  const { data: entries } = await access.supabase.from("content_entries").select("label, kind, draft_value, content_key")
    .eq("block_id", block.id).eq("organization_id", access.session.organizationId);
  const { data: created, error } = await access.supabase.from("page_blocks").insert({
    organization_id: access.session.organizationId, website_id: block.website_id, page_id: block.page_id,
    type: block.type, position: block.position + 1, config: {}, draft_config: block.draft_config,
    draft_visible: true, has_unpublished_changes: true, updated_by: access.session.userId,
  }).select("id").single();
  if (error || !created) return { error: "No se pudo duplicar el bloque." };
  if (entries?.length) {
    const token = created.id.slice(0, 8);
    const { error: entryError } = await access.supabase.from("content_entries").insert(entries.map((entry) => ({
      organization_id: access.session.organizationId, website_id: block.website_id, page_id: block.page_id, block_id: created.id,
      content_key: `${entry.content_key}.copy.${token}`, label: entry.label, kind: entry.kind,
      value: null, draft_value: entry.draft_value, has_unpublished_changes: true, updated_by: access.session.userId,
    })));
    if (entryError) return { error: "El bloque se duplicó, pero faltan sus textos." };
  }
  await access.supabase.from("pages").update({ has_unpublished_changes: true }).eq("id", block.page_id).eq("organization_id", access.session.organizationId);
  refreshEditor(block.website_id);
  return { success: "Bloque duplicado." };
}

export async function removeBlock(blockId: string): Promise<EditorActionResult> {
  const parsed = z.string().uuid().safeParse(blockId);
  if (!parsed.success) return { error: "Bloque no válido." };
  const access = await requireEditor();
  if ("error" in access) return access;
  const { data, error } = await access.supabase.from("page_blocks").update({
    draft_visible: false, has_unpublished_changes: true, updated_by: access.session.userId, updated_at: new Date().toISOString(),
  }).eq("id", parsed.data).eq("organization_id", access.session.organizationId).select("website_id, page_id").maybeSingle();
  if (error || !data) return { error: "No se pudo retirar el bloque." };
  await access.supabase.from("pages").update({ has_unpublished_changes: true }).eq("id", data.page_id).eq("organization_id", access.session.organizationId);
  refreshEditor(data.website_id);
  return { success: "Bloque retirado del borrador." };
}

export async function selectBlockImage(input: { blockId: string; mediaId: string }): Promise<EditorActionResult> {
  const parsed = z.object({ blockId: z.string().uuid(), mediaId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Imagen no válida." };
  const access = await requireEditor();
  if ("error" in access) return access;
  const [block, mediaResult] = await Promise.all([
    ownedBlock(access, parsed.data.blockId),
    access.supabase.from("media").select("id").eq("id", parsed.data.mediaId).eq("organization_id", access.session.organizationId).is("deleted_at", null).maybeSingle(),
  ]);
  if (!block || !mediaResult.data) return { error: "El bloque o la imagen no pertenecen a esta organización." };
  const config = { ...(block.draft_config as BlockConfig), imageId: mediaResult.data.id };
  const { error } = await access.supabase.from("page_blocks").update({ draft_config: config, has_unpublished_changes: true, updated_by: access.session.userId })
    .eq("id", block.id).eq("organization_id", access.session.organizationId);
  if (error) return { error: "No se pudo usar la imagen." };
  refreshEditor(block.website_id);
  return { success: "Imagen añadida al borrador." };
}

export async function uploadEditorImage(formData: FormData): Promise<EditorActionResult> {
  const blockId = z.string().uuid().safeParse(formData.get("blockId"));
  const file = formData.get("file");
  const altText = String(formData.get("altText") ?? "").trim().slice(0, 500);
  if (!blockId.success || !(file instanceof File)) return { error: "Selecciona una imagen válida." };
  const declaredMime = mimeForPath(file.name);
  if (!declaredMime || !isSupportedImageMime(file.type) || declaredMime !== file.type || file.size <= 0 || file.size > 12 * 1024 * 1024) {
    return { error: "Usa JPEG, PNG, WebP o AVIF de hasta 12 MB." };
  }
  const access = await requireEditor();
  if ("error" in access) return access;
  const block = await ownedBlock(access, blockId.data);
  if (!block) return { error: "Bloque no disponible." };
  let output: Buffer;
  try {
    output = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch {
    return { error: "No pudimos procesar esta imagen." };
  }
  const storagePath = `${access.session.organizationId}/${randomUUID()}.webp`;
  const { error: uploadError } = await access.supabase.storage.from("media").upload(storagePath, output, { contentType: "image/webp", upsert: false });
  if (uploadError) return { error: "No se pudo subir la imagen optimizada." };
  const baseName = file.name.replace(/\.[^.]+$/, "").slice(0, 240);
  const { data: media, error: recordError } = await access.supabase.from("media").insert({
    organization_id: access.session.organizationId, website_id: block.website_id, storage_path: storagePath,
    filename: `${baseName}.webp`, mime_type: "image/webp", bytes: output.byteLength,
    alt_text: altText || null, created_by: access.session.userId,
  }).select("id").single();
  if (recordError || !media) {
    await access.supabase.storage.from("media").remove([storagePath]);
    return { error: "No se pudo registrar la imagen optimizada." };
  }
  const config = { ...(block.draft_config as BlockConfig), imageId: media.id };
  const { error: blockError } = await access.supabase.from("page_blocks").update({ draft_config: config, has_unpublished_changes: true, updated_by: access.session.userId })
    .eq("id", block.id).eq("organization_id", access.session.organizationId);
  if (blockError) return { error: "La imagen quedó en la biblioteca, pero no se pudo colocar en el bloque." };
  refreshEditor(block.website_id);
  revalidatePath("/media");
  return { success: `Imagen optimizada a WebP (${Math.max(1, Math.round(output.byteLength / 1024))} KB).` };
}

export async function restoreOriginal(websiteId: string): Promise<EditorActionResult> {
  const parsed = z.string().uuid().safeParse(websiteId);
  if (!parsed.success) return { error: "Web no válida." };
  const access = await requireEditor();
  if ("error" in access) return access;
  const { data: website } = await access.supabase.from("websites").select("id").eq("id", parsed.data).eq("organization_id", access.session.organizationId).maybeSingle();
  if (!website) return { error: "Web no disponible." };
  const [{ data: pages }, { data: blocks }, { data: entries }] = await Promise.all([
    access.supabase.from("pages").select("id, title, meta_description, is_indexable").eq("website_id", website.id).eq("organization_id", access.session.organizationId),
    access.supabase.from("page_blocks").select("id, config, is_published").eq("website_id", website.id).eq("organization_id", access.session.organizationId),
    access.supabase.from("content_entries").select("id, value").eq("website_id", website.id).eq("organization_id", access.session.organizationId),
  ]);
  await Promise.all([
    ...(pages ?? []).map((row) => access.supabase.from("pages").update({ draft_title: row.title, draft_meta_description: row.meta_description, draft_is_indexable: row.is_indexable, has_unpublished_changes: false }).eq("id", row.id).eq("organization_id", access.session.organizationId)),
    ...(blocks ?? []).map((row) => access.supabase.from("page_blocks").update({ draft_config: row.config, draft_visible: row.is_published, has_unpublished_changes: false, updated_by: access.session.userId }).eq("id", row.id).eq("organization_id", access.session.organizationId)),
    ...(entries ?? []).map((row) => access.supabase.from("content_entries").update({ draft_value: row.value, has_unpublished_changes: false, updated_by: access.session.userId }).eq("id", row.id).eq("organization_id", access.session.organizationId)),
  ]);
  refreshEditor(website.id);
  return { success: "Borrador restaurado a la última versión publicada." };
}

async function publicationWarnings(access: Exclude<Awaited<ReturnType<typeof requirePublisher>>, { error: string }>, websiteId: string) {
  const [{ data: pages }, { data: blocks }, { data: entries }, { data: media }] = await Promise.all([
    access.supabase.from("pages").select("id, path, draft_meta_description").eq("website_id", websiteId).eq("organization_id", access.session.organizationId),
    access.supabase.from("page_blocks").select("id, draft_config").eq("website_id", websiteId).eq("organization_id", access.session.organizationId).eq("draft_visible", true),
    access.supabase.from("content_entries").select("block_id, content_key, draft_value").eq("website_id", websiteId).eq("organization_id", access.session.organizationId),
    access.supabase.from("media").select("id, alt_text").eq("website_id", websiteId).eq("organization_id", access.session.organizationId).is("deleted_at", null),
  ]);
  const warnings: string[] = [];
  for (const page of pages ?? []) if (!page.draft_meta_description?.trim()) warnings.push(`${page.path}: falta la meta description.`);
  const h1Blocks = new Set((blocks ?? []).filter((block) => (block.draft_config as BlockConfig)?.headingLevel === "h1").map((block) => block.id));
  const h1Pages = new Set((entries ?? []).filter((entry) => h1Blocks.has(entry.block_id) && entry.content_key.endsWith(".heading") && textValue(entry.draft_value).trim()).map((entry) => entry.block_id));
  if (h1Blocks.size === 0 || h1Pages.size === 0) warnings.push("Falta un H1 con contenido.");
  const mediaById = new Map((media ?? []).map((item) => [item.id, item.alt_text]));
  for (const block of blocks ?? []) {
    const imageId = (block.draft_config as BlockConfig)?.imageId;
    if (imageId && !mediaById.get(imageId)?.trim()) warnings.push("Hay una imagen sin texto alternativo.");
  }
  return [...new Set(warnings)];
}

function textValue(value: unknown) { return typeof value === "string" ? value : value == null ? "" : JSON.stringify(value); }

export async function publishWebsite(input: { websiteId: string; acceptWarnings?: boolean }): Promise<EditorActionResult> {
  const parsed = z.object({ websiteId: z.string().uuid(), acceptWarnings: z.boolean().optional() }).safeParse(input);
  if (!parsed.success) return { error: "Web no válida." };
  const access = await requirePublisher();
  if ("error" in access) return access;
  const { data: website } = await access.supabase.from("websites").select("id").eq("id", parsed.data.websiteId).eq("organization_id", access.session.organizationId).maybeSingle();
  if (!website) return { error: "Web no disponible en esta organización." };
  const warnings = await publicationWarnings(access, website.id);
  if (warnings.length && !parsed.data.acceptWarnings) return { requiresConfirmation: true, warnings };
  const { error } = await access.supabase.rpc("publish_website_draft", { target_website: website.id, scheduled_run: false });
  if (error) return { error: "No se pudo publicar el borrador." };
  refreshEditor(website.id);
  return { success: warnings.length ? "Sitio publicado con avisos pendientes." : "Sitio publicado correctamente.", warnings };
}

export async function restoreVersion(input: { websiteId: string; versionId: string }): Promise<EditorActionResult> {
  const parsed = z.object({ websiteId: z.string().uuid(), versionId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Versión no válida." };
  const access = await requireEditor();
  if ("error" in access) return access;
  const { data: website } = await access.supabase.from("websites").select("id").eq("id", parsed.data.websiteId).eq("organization_id", access.session.organizationId).maybeSingle();
  if (!website) return { error: "Web no disponible." };
  const { error } = await access.supabase.rpc("restore_website_version", { target_website: website.id, target_version: parsed.data.versionId });
  if (error) return { error: "No se pudo recuperar esa versión." };
  refreshEditor(website.id);
  return { success: "La versión se recuperó como borrador. Revísala antes de publicar." };
}

export async function scheduleSitePublish(input: { websiteId: string; publishAt: string }): Promise<EditorActionResult> {
  const parsed = z.object({ websiteId: z.string().uuid(), publishAt: z.string().datetime() }).safeParse(input);
  if (!parsed.success) return { error: "Fecha de publicación no válida." };
  const when = new Date(parsed.data.publishAt);
  if (when.getTime() < Date.now() + 60_000 || when.getTime() > Date.now() + 366 * 24 * 60 * 60 * 1000) return { error: "Elige una fecha futura dentro de los próximos 12 meses." };
  const access = await requirePublisher();
  if ("error" in access) return access;
  const { data, error } = await access.supabase.from("websites").update({ publish_at: when.toISOString(), updated_at: new Date().toISOString() })
    .eq("id", parsed.data.websiteId).eq("organization_id", access.session.organizationId).select("id").maybeSingle();
  if (error || !data) return { error: "No se pudo programar esta publicación." };
  refreshEditor(data.id);
  return { success: `Publicación programada para ${new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" }).format(when)}.` };
}
