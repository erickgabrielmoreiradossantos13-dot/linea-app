"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionContext } from "@/features/session/context";
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
