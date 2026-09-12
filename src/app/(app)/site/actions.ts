"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionContext } from "@/features/session/context";
import { materializeImportedHtml } from "@/features/site-import/materialize";
import { parseSiteZip } from "@/features/site-import/parser";
import { can } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/features";

type ActionResult = { error?: string; success?: string };

function parseDomain(rawValue: FormDataEntryValue | null) {
  const raw = String(rawValue ?? "").trim();
  const url = new URL(raw.startsWith("https://") ? raw : `https://${raw}`);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !url.hostname.includes(".") ||
    /^[\d.]+$/.test(url.hostname)
  ) {
    throw new Error("invalid_domain");
  }
  return url;
}

async function requireSiteAdmin() {
  const session = await getSessionContext();
  requireFeature(session, "site");
  if (!can(session.role, "ADMIN")) return { error: "No tienes permiso para configurar la web." } as const;
  if (session.isDemo) return { error: "La demostración no guarda cambios reales." } as const;
  return { session, supabase: await createSupabaseServerClient() } as const;
}

async function recordSiteChange(
  access: Exclude<Awaited<ReturnType<typeof requireSiteAdmin>>, { error: string }>,
  websiteId: string,
  action: string,
  targetType: string,
  targetId: string,
  changes: Record<string, unknown>
) {
  return access.supabase.from("site_change_log").insert({
    organization_id: access.session.organizationId,
    website_id: websiteId,
    actor_user_id: access.session.userId,
    action,
    target_type: targetType,
    target_id: targetId,
    changes,
  });
}

export async function setWebsiteDomain(formData: FormData): Promise<ActionResult> {
  const access = await requireSiteAdmin();
  if ("error" in access) return access;

  let url: URL;
  try {
    url = parseDomain(formData.get("domain"));
  } catch {
    return { error: "Introduce un dominio válido, por ejemplo lineasur.online." };
  }

  const idValue = String(formData.get("websiteId") ?? "");
  const parsedId = z.string().uuid().safeParse(idValue);
  let websiteId: string;

  if (parsedId.success) {
    const { data: website, error } = await access.supabase
      .from("websites")
      .update({ domain: url.hostname, allowed_origin: url.origin, updated_at: new Date().toISOString() })
      .eq("id", parsedId.data)
      .eq("organization_id", access.session.organizationId)
      .select("id")
      .maybeSingle();
    if (error || !website) return { error: "No pudimos actualizar una web de esta organización." };
    websiteId = website.id;
  } else {
    const { data: website, error } = await access.supabase
      .from("websites")
      .insert({
        organization_id: access.session.organizationId,
        name: "Web principal",
        domain: url.hostname,
        allowed_origin: url.origin,
        status: "ACTIVE",
      })
      .select("id")
      .single();
    if (error || !website) return { error: "No pudimos registrar la web." };
    websiteId = website.id;
  }

  const { error: logError } = await recordSiteChange(
    access,
    websiteId,
    parsedId.success ? "website.domain_updated" : "website.created",
    "website",
    websiteId,
    { domain: url.hostname, allowed_origin: url.origin }
  );
  if (logError) return { error: "La web se guardó, pero no se pudo registrar el cambio en el historial." };

  revalidatePath("/site");
  revalidatePath("/settings");
  return { success: parsedId.success ? "Dominio actualizado." : "Web registrada. Ya puedes añadir sus páginas." };
}

export async function createPage(formData: FormData): Promise<ActionResult> {
  const parsed = z.object({
    websiteId: z.string().uuid(),
    path: z.string().regex(/^\/(?!\/)[^?#\s]*$/).max(500),
    title: z.string().trim().min(2).max(180),
    metaDescription: z.string().trim().max(320).optional(),
    isIndexable: z.boolean(),
  }).safeParse({
    websiteId: formData.get("websiteId"),
    path: formData.get("path"),
    title: formData.get("title"),
    metaDescription: formData.get("metaDescription"),
    isIndexable: formData.get("isIndexable") === "on",
  });
  if (!parsed.success) return { error: "Revisa el título y una ruta que empiece por /." };

  const access = await requireSiteAdmin();
  if ("error" in access) return access;
  const { data: website, error: websiteError } = await access.supabase
    .from("websites")
    .select("id")
    .eq("id", parsed.data.websiteId)
    .eq("organization_id", access.session.organizationId)
    .maybeSingle();
  if (websiteError || !website) return { error: "Web no disponible en esta organización." };

  const { data: page, error } = await access.supabase
    .from("pages")
    .insert({
      website_id: website.id,
      organization_id: access.session.organizationId,
      path: parsed.data.path,
      title: parsed.data.title,
      meta_description: parsed.data.metaDescription || null,
      is_indexable: parsed.data.isIndexable,
      draft_title: parsed.data.title,
      draft_meta_description: parsed.data.metaDescription || null,
      draft_is_indexable: parsed.data.isIndexable,
      has_unpublished_changes: true,
    })
    .select("id")
    .single();
  if (error || !page) return { error: "No se pudo crear la página. Comprueba que la ruta no exista." };

  const { error: logError } = await recordSiteChange(access, website.id, "page.created", "page", page.id, {
    path: parsed.data.path,
    title: parsed.data.title,
    meta_description: parsed.data.metaDescription || null,
    is_indexable: parsed.data.isIndexable,
  });
  if (logError) return { error: "La página se creó, pero no se pudo registrar el cambio en el historial." };

  revalidatePath("/site");
  return { success: "Página creada." };
}

export async function updatePageSeo(formData: FormData): Promise<ActionResult> {
  const parsed = z.object({
    pageId: z.string().uuid(),
    title: z.string().trim().min(2).max(180),
    metaDescription: z.string().trim().max(320).optional(),
    isIndexable: z.boolean(),
  }).safeParse({
    pageId: formData.get("pageId"),
    title: formData.get("title"),
    metaDescription: formData.get("metaDescription"),
    isIndexable: formData.get("isIndexable") === "on",
  });
  if (!parsed.success) return { error: "Revisa el título y la descripción SEO." };
  const access = await requireSiteAdmin();
  if ("error" in access) return access;

  const { data: page, error } = await access.supabase
    .from("pages")
    .update({
      draft_title: parsed.data.title,
      draft_meta_description: parsed.data.metaDescription || null,
      draft_is_indexable: parsed.data.isIndexable,
      has_unpublished_changes: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.pageId)
    .eq("organization_id", access.session.organizationId)
    .select("id, website_id, path")
    .maybeSingle();
  if (error || !page) return { error: "No se pudo actualizar una página de esta organización." };

  revalidatePath("/site");
  revalidatePath("/seo");
  revalidatePath(`/site/${page.website_id}/edit`);
  return { success: "SEO guardado en el borrador." };
}

export async function connectWebsite(formData: FormData) {
  return setWebsiteDomain(formData);
}

export async function addPage(formData: FormData) {
  return createPage(formData);
}

type ImportStartResult = ActionResult & {
  importId?: string;
  storagePath?: string;
};

export async function beginSiteImport(input: { websiteId: string; filename: string; bytes: number }): Promise<ImportStartResult> {
  const parsed = z.object({
    websiteId: z.string().uuid(),
    filename: z.string().trim().min(1).max(255).refine((value) => value.toLowerCase().endsWith(".zip")),
    bytes: z.number().int().positive().max(50 * 1024 * 1024),
  }).safeParse(input);
  if (!parsed.success) return { error: "Escolhe um arquivo .zip de até 50 MB." };
  const access = await requireSiteAdmin();
  if ("error" in access) return access;
  const { data: website } = await access.supabase.from("websites").select("id")
    .eq("id", parsed.data.websiteId).eq("organization_id", access.session.organizationId).eq("status", "ACTIVE").maybeSingle();
  if (!website) return { error: "Web não disponível nesta organização." };

  const now = Date.now();
  await Promise.all([
    access.supabase.from("site_imports").update({ status: "FAILED", error_message: "Upload expirado; inicia uma nova importação." })
      .eq("website_id", website.id).eq("organization_id", access.session.organizationId).eq("status", "UPLOADING")
      .lt("created_at", new Date(now - 10 * 60_000).toISOString()),
    access.supabase.from("site_imports").update({ status: "FAILED", error_message: "Processamento expirado; inicia uma nova importação." })
      .eq("website_id", website.id).eq("organization_id", access.session.organizationId).eq("status", "PROCESSING")
      .lt("created_at", new Date(now - 20 * 60_000).toISOString()),
  ]);
  const { data: running } = await access.supabase.from("site_imports").select("id, status")
    .eq("website_id", website.id).eq("organization_id", access.session.organizationId)
    .in("status", ["UPLOADING", "PROCESSING"]).limit(1).maybeSingle();
  if (running) return { error: "Já existe uma importação em curso. Aguarda alguns minutos ou recarrega a página para verificar o estado." };

  const importId = randomUUID();
  const storagePath = `${access.session.organizationId}/${website.id}/${importId}/source.zip`;
  const { error: insertError } = await access.supabase.from("site_imports").insert({
    id: importId,
    organization_id: access.session.organizationId,
    website_id: website.id,
    source_zip_path: storagePath,
    filename: parsed.data.filename,
    status: "UPLOADING",
    created_by: access.session.userId,
  });
  if (insertError) return { error: "Não foi possível iniciar a importação." };
  return { importId, storagePath };
}

export async function cancelSiteImport(input: { websiteId: string; importId: string }): Promise<ActionResult> {
  const parsed = z.object({ websiteId: z.string().uuid(), importId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Importação inválida." };
  const access = await requireSiteAdmin();
  if ("error" in access) return access;
  const { data: siteImport } = await access.supabase.from("site_imports").select("id, source_zip_path, status")
    .eq("id", parsed.data.importId).eq("website_id", parsed.data.websiteId)
    .eq("organization_id", access.session.organizationId).maybeSingle();
  if (!siteImport || siteImport.status === "READY") return { error: "Esta importação já não pode ser cancelada." };
  await access.supabase.storage.from("sites").remove([siteImport.source_zip_path]);
  const { error } = await access.supabase.from("site_imports").update({
    status: "FAILED",
    error_message: "Upload cancelado pelo utilizador.",
    completed_at: new Date().toISOString(),
  }).eq("id", siteImport.id).eq("organization_id", access.session.organizationId);
  return error ? { error: "Não foi possível cancelar a importação." } : { success: "Importação cancelada." };
}

export async function reportSiteImportFailure(input: { websiteId: string; importId: string; message: string }): Promise<void> {
  const parsed = z.object({ websiteId: z.string().uuid(), importId: z.string().uuid(), message: z.string().trim().min(1).max(500) }).safeParse(input);
  if (!parsed.success) return;
  const access = await requireSiteAdmin();
  if ("error" in access) return;
  await access.supabase.from("site_imports").update({
    status: "FAILED",
    error_message: parsed.data.message,
    completed_at: new Date().toISOString(),
  }).eq("id", parsed.data.importId).eq("website_id", parsed.data.websiteId)
    .eq("organization_id", access.session.organizationId).neq("status", "READY");
}

async function uploadImportedFiles(
  access: Exclude<Awaited<ReturnType<typeof requireSiteAdmin>>, { error: string }>,
  websiteId: string,
  importId: string,
  files: Awaited<ReturnType<typeof parseSiteZip>>["files"]
) {
  const records: Array<Record<string, unknown>> = [];
  for (let index = 0; index < files.length; index += 8) {
    const batch = files.slice(index, index + 8);
    const results = await Promise.all(batch.map(async (file) => {
      const storagePath = `${access.session.organizationId}/${websiteId}/${importId}/files/${file.path}`;
      const { error } = await access.supabase.storage.from("sites").upload(storagePath, file.bytes, {
        contentType: file.mimeType,
        upsert: true,
      });
      return { file, storagePath, error };
    }));
    const failed = results.find((result) => result.error);
    if (failed) throw new Error(`Falha ao guardar ${failed.file.path}.`);
    records.push(...results.map(({ file, storagePath }) => ({
      organization_id: access.session.organizationId,
      website_id: websiteId,
      import_id: importId,
      path: file.path,
      storage_path: storagePath,
      mime_type: file.mimeType,
      bytes: file.bytes.byteLength,
    })));
  }
  for (let index = 0; index < records.length; index += 500) {
    const { error } = await access.supabase.from("site_files").upsert(records.slice(index, index + 500), { onConflict: "import_id,path" });
    if (error) throw new Error("Não foi possível indexar os arquivos extraídos.");
  }
}

export async function finishSiteImport(input: { websiteId: string; importId: string; storagePath: string }): Promise<ActionResult> {
  const parsed = z.object({ websiteId: z.string().uuid(), importId: z.string().uuid(), storagePath: z.string().min(10).max(1_000) }).safeParse(input);
  if (!parsed.success) return { error: "Importação inválida." };
  const access = await requireSiteAdmin();
  if ("error" in access) return access;
  const { data: siteImport } = await access.supabase.from("site_imports").select("id, source_zip_path")
    .eq("id", parsed.data.importId).eq("website_id", parsed.data.websiteId)
    .eq("organization_id", access.session.organizationId).maybeSingle();
  if (!siteImport || siteImport.source_zip_path !== parsed.data.storagePath) return { error: "Importação não disponível nesta organização." };
  await access.supabase.from("site_imports").update({ status: "PROCESSING", error_message: null })
    .eq("id", siteImport.id).eq("organization_id", access.session.organizationId);

  try {
    const { data: archive, error: downloadError } = await access.supabase.storage.from("sites").download(siteImport.source_zip_path);
    if (downloadError || !archive) throw new Error("Não foi possível ler o ZIP enviado.");
    const parsedSite = await parseSiteZip(new Uint8Array(await archive.arrayBuffer()), parsed.data.websiteId, parsed.data.importId);
    await uploadImportedFiles(access, parsed.data.websiteId, parsed.data.importId, parsedSite.files);
    const pagesPayload = parsedSite.pages.map((page) => ({
      id: page.id,
      path: page.path,
      title: page.title,
      metaDescription: page.metaDescription ?? "",
      sourceFilePath: page.sourceFilePath,
      originalHtml: page.originalHtml,
      templateHtml: page.templateHtml,
      publishedHtml: materializeImportedHtml(page.templateHtml, page.blocks.map((block) => ({
        id: block.id, type: block.type, selector: block.selector, draftVisible: true, value: block.originalValue,
      })), true),
    }));
    const blocksPayload = parsedSite.pages.flatMap((page) => page.blocks.map((block) => ({
      ...block,
      pageId: page.id,
      attributeName: block.attributeName ?? "",
    })));
    const { error: replaceError } = await access.supabase.rpc("replace_website_import", {
      target_website: parsed.data.websiteId,
      target_import: parsed.data.importId,
      pages_payload: pagesPayload,
      blocks_payload: blocksPayload,
    });
    if (replaceError) throw new Error("Não foi possível ativar as páginas importadas.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao processar o site.";
    await access.supabase.from("site_imports").update({ status: "FAILED", error_message: message.slice(0, 500) })
      .eq("id", parsed.data.importId).eq("organization_id", access.session.organizationId);
    return { error: message };
  }
  revalidatePath("/site");
  revalidatePath(`/site/${parsed.data.websiteId}/edit`);
  revalidatePath(`/sites/${parsed.data.websiteId}`, "layout");
  return { success: "Site importado. O design original já está pronto para edição por clique." };
}
