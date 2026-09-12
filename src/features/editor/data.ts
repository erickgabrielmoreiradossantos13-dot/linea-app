import { can, canEditContent } from "@/lib/authz";
import type { SessionContext } from "@/features/session/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BlockConfig, BlockType, EditorData, EditorEntry, EditorMedia } from "./types";

function textValue(value: unknown) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return JSON.stringify(value);
}

function demoEditorData(session: SessionContext, websiteId: string): EditorData {
  const page = { id: "demo-page-home", path: "/", title: "Clínica Dental Málaga", metaDescription: "Tu sonrisa, en buenas manos.", isIndexable: true, hasUnpublishedChanges: false, editorMode: "BLOCKS" as const, updatedAt: new Date().toISOString() };
  return {
    website: { id: websiteId, name: "Web principal", domain: "clinicadentalmalaga.es", publishedAt: new Date().toISOString(), publishAt: null, sourceMode: "BLOCKS" },
    pages: [page], currentPage: page,
    blocks: [
      { id: "demo-block-hero", type: "text", position: 0, config: { eyebrow: "Salud y confianza", headingLevel: "h1", tone: "accent" }, isPublished: true, hasUnpublishedChanges: false, selector: null, importedValue: null, entries: [
        { id: "demo-entry-heading", key: "home.hero.heading", label: "Título", kind: "text", value: "Una sonrisa que habla de ti" },
        { id: "demo-entry-body", key: "home.hero.body", label: "Texto", kind: "rich_text", value: "Odontología cercana, clara y pensada para que vuelvas a sonreír con tranquilidad." },
      ] },
      { id: "demo-block-cards", type: "cards", position: 1, config: { headingLevel: "h2", items: [
        { id: "demo-card-1", title: "Primera visita", body: "Te escuchamos y diseñamos un plan claro." },
        { id: "demo-card-2", title: "Tratamiento", body: "Tecnología y acompañamiento en cada paso." },
        { id: "demo-card-3", title: "Seguimiento", body: "Cuidamos el resultado contigo." },
      ] }, isPublished: true, hasUnpublishedChanges: false, selector: null, importedValue: null, entries: [{ id: "demo-entry-services", key: "home.services.heading", label: "Título", kind: "text", value: "Todo lo que tu sonrisa necesita" }] },
    ],
    media: [], history: [], role: session.role,
    canEdit: false, canPublish: false, hasDraft: false,
  };
}

export async function getEditorData(session: SessionContext, websiteId: string, requestedPageId?: string): Promise<EditorData | null> {
  if (session.isDemo) return demoEditorData(session, websiteId);
  const supabase = await createSupabaseServerClient();
  const { data: website, error: websiteError } = await supabase
    .from("websites")
    .select("id, name, domain, published_at, publish_at, source_mode")
    .eq("id", websiteId)
    .eq("organization_id", session.organizationId)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (websiteError) throw new Error("No se pudo cargar la web en el editor.");
  if (!website) return null;

  const [{ data: pageRows, error: pageError }, { data: mediaRows, error: mediaError }, { data: logRows, error: logError }] = await Promise.all([
    supabase.from("pages")
      .select("id, path, draft_title, draft_meta_description, draft_is_indexable, has_unpublished_changes, editor_mode, updated_at")
      .eq("organization_id", session.organizationId).eq("website_id", website.id).order("path"),
    supabase.from("media")
      .select("id, filename, alt_text, storage_path")
      .eq("organization_id", session.organizationId).or(`website_id.eq.${website.id},website_id.is.null`).is("deleted_at", null).order("created_at", { ascending: false }).limit(100),
    supabase.from("site_change_log")
      .select("id, action, changes, created_at")
      .eq("organization_id", session.organizationId).eq("website_id", website.id)
      .in("action", ["site.published", "site.published_scheduled", "site.version_restored"])
      .order("created_at", { ascending: false }).limit(40),
  ]);
  if (pageError || mediaError || logError) throw new Error("No se pudieron cargar los datos del editor.");

  const pages = (pageRows ?? []).map((row) => ({
    id: row.id, path: row.path, title: row.draft_title, metaDescription: row.draft_meta_description ?? "",
    isIndexable: row.draft_is_indexable, hasUnpublishedChanges: row.has_unpublished_changes,
    editorMode: row.editor_mode as "BLOCKS" | "IMPORTED", updatedAt: row.updated_at,
  }));
  const currentPage = pages.find((page) => page.id === requestedPageId) ?? pages[0] ?? null;

  const { data: signed } = await supabase.storage.from("media").createSignedUrls((mediaRows ?? []).map((row) => row.storage_path), 60 * 60);
  const media: EditorMedia[] = (mediaRows ?? []).map((row, index) => ({
    id: row.id, filename: row.filename, altText: row.alt_text, url: signed?.[index]?.signedUrl ?? null,
  }));
  const mediaById = new Map(media.map((item) => [item.id, item]));

  let blocks: EditorData["blocks"] = [];
  if (currentPage) {
    const [{ data: blockRows, error: blockError }, { data: entryRows, error: entryError }] = await Promise.all([
      supabase.from("page_blocks")
        .select("id, type, position, draft_config, is_published, has_unpublished_changes, selector, current_value_draft")
        .eq("organization_id", session.organizationId).eq("website_id", website.id).eq("page_id", currentPage.id)
        .eq("draft_visible", true).order("position"),
      supabase.from("content_entries")
        .select("id, block_id, content_key, label, kind, draft_value")
        .eq("organization_id", session.organizationId).eq("website_id", website.id).eq("page_id", currentPage.id)
        .not("block_id", "is", null).order("created_at"),
    ]);
    if (blockError || entryError) throw new Error("No se pudieron cargar los bloques de la página.");
    const entriesByBlock = new Map<string, EditorEntry[]>();
    for (const row of entryRows ?? []) {
      const entry = { id: row.id, key: row.content_key, label: row.label, kind: row.kind, value: textValue(row.draft_value) };
      entriesByBlock.set(row.block_id, [...(entriesByBlock.get(row.block_id) ?? []), entry]);
    }
    blocks = (blockRows ?? []).map((row) => {
      const rawConfig = (row.draft_config && typeof row.draft_config === "object" && !Array.isArray(row.draft_config) ? row.draft_config : {}) as BlockConfig;
      const linkedMedia = rawConfig.imageId ? mediaById.get(rawConfig.imageId) : undefined;
      return {
        id: row.id, type: row.type as BlockType, position: row.position,
        config: { ...rawConfig, imageUrl: linkedMedia?.url ?? null, imageAlt: linkedMedia?.altText ?? null },
        entries: entriesByBlock.get(row.id) ?? [], isPublished: row.is_published, hasUnpublishedChanges: row.has_unpublished_changes,
        selector: row.selector, importedValue: row.current_value_draft as EditorData["blocks"][number]["importedValue"],
      };
    });
  }

  return {
    website: { id: website.id, name: website.name, domain: website.domain, publishedAt: website.published_at, publishAt: website.publish_at, sourceMode: website.source_mode as "BLOCKS" | "IMPORTED" },
    pages, currentPage, blocks, media,
    history: (logRows ?? []).map((row) => {
      const changes = row.changes && typeof row.changes === "object" && !Array.isArray(row.changes) ? row.changes as Record<string, unknown> : {};
      const versionId = typeof changes.version_id === "string" ? changes.version_id : null;
      return { id: Number(row.id), action: row.action, label: row.action === "site.published_scheduled" ? "Publicación programada" : row.action === "site.version_restored" ? "Versión recuperada" : "Publicación manual", versionId, createdAt: row.created_at };
    }),
    role: session.role, canEdit: canEditContent(session.role), canPublish: can(session.role, "ADMIN"),
    hasDraft: pages.some((page) => page.hasUnpublishedChanges) || blocks.some((block) => block.hasUnpublishedChanges || !block.isPublished),
  };
}
