import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BlockConfig, BlockType, EditorBlock, EditorEntry } from "./types";

export type PublishedPageData = {
  websiteId: string;
  websiteName: string;
  title: string;
  description: string | null;
  indexable: boolean;
  blocks: EditorBlock[];
};

function textValue(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : JSON.stringify(value);
}

export async function getPublishedPage(websiteId: string, path: string): Promise<PublishedPageData | null> {
  const supabase = createSupabaseAdminClient();
  const { data: website, error: websiteError } = await supabase.from("websites")
    .select("id, name, organization_id").eq("id", websiteId).eq("status", "ACTIVE").maybeSingle();
  if (websiteError || !website) return null;
  const { data: page, error: pageError } = await supabase.from("pages")
    .select("id, title, meta_description, is_indexable").eq("website_id", website.id)
    .eq("organization_id", website.organization_id).eq("path", path).maybeSingle();
  if (pageError || !page) return null;
  const [{ data: blockRows, error: blockError }, { data: entryRows, error: entryError }] = await Promise.all([
    supabase.from("page_blocks").select("id, type, position, config")
      .eq("website_id", website.id).eq("organization_id", website.organization_id).eq("page_id", page.id).eq("is_published", true).order("position"),
    supabase.from("content_entries").select("id, block_id, content_key, label, kind, value")
      .eq("website_id", website.id).eq("organization_id", website.organization_id).eq("page_id", page.id).not("block_id", "is", null),
  ]);
  if (blockError || entryError) return null;
  const configs = (blockRows ?? []).map((row) => (row.config && typeof row.config === "object" && !Array.isArray(row.config) ? row.config : {}) as BlockConfig);
  const imageIds = [...new Set(configs.map((config) => config.imageId).filter((id): id is string => Boolean(id)))];
  const mediaById = new Map<string, { url: string | null; alt: string | null }>();
  if (imageIds.length) {
    const { data: mediaRows } = await supabase.from("media").select("id, storage_path, alt_text")
      .eq("organization_id", website.organization_id).in("id", imageIds).is("deleted_at", null);
    const { data: signed } = await supabase.storage.from("media").createSignedUrls((mediaRows ?? []).map((item) => item.storage_path), 60 * 60);
    (mediaRows ?? []).forEach((item, index) => mediaById.set(item.id, { url: signed?.[index]?.signedUrl ?? null, alt: item.alt_text }));
  }
  const entriesByBlock = new Map<string, EditorEntry[]>();
  for (const row of entryRows ?? []) {
    const entry = { id: row.id, key: row.content_key, label: row.label, kind: row.kind, value: textValue(row.value) };
    entriesByBlock.set(row.block_id, [...(entriesByBlock.get(row.block_id) ?? []), entry]);
  }
  const blocks = (blockRows ?? []).map((row, index) => {
    const config = configs[index]; const image = config.imageId ? mediaById.get(config.imageId) : undefined;
    return { id: row.id, type: row.type as BlockType, position: row.position, config: { ...config, imageUrl: image?.url ?? null, imageAlt: image?.alt ?? null }, entries: entriesByBlock.get(row.id) ?? [], isPublished: true, hasUnpublishedChanges: false, selector: null, importedValue: null };
  });
  return { websiteId: website.id, websiteName: website.name, title: page.title, description: page.meta_description, indexable: page.is_indexable, blocks };
}
