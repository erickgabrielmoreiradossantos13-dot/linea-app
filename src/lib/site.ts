import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import * as demoSite from "@/lib/demo/site";
import type {
  Site,
  SiteChangeLogEntry,
  SiteCollectionItem,
  SiteContent,
  SiteField,
  SiteSchema,
} from "@/lib/types";

/**
 * Contrato "SiteAdapter": cualquier forma de conectar una web a Línea App
 * (nativa hoy, otros stacks en el futuro) debe poder responder a esto.
 * Hoy solo existe un adapter real: las tablas site_* de Supabase (sitios
 * "linea-nextjs"), más su equivalente en modo demo (cookies).
 */
export interface SiteAdapter {
  getSiteForBusiness(businessId: string): Promise<Site | null>;
  getContent(siteId: string): Promise<SiteContent | null>;
  saveFieldDraft(fieldId: string, value: unknown): Promise<void>;
  discardDraft(siteId: string): Promise<void>;
  publish(siteId: string, actorEmail: string | null): Promise<void>;
  getChangeLog(siteId: string): Promise<SiteChangeLogEntry[]>;
}

async function getSchema(siteId: string): Promise<SiteSchema | null> {
  const supabase = await createClient();

  const { data: site } = await supabase.from("sites").select("*").eq("id", siteId).maybeSingle();
  if (!site) return null;

  const { data: pages } = await supabase
    .from("site_pages")
    .select("*")
    .eq("site_id", siteId)
    .order("position", { ascending: true });

  const pageIds = (pages ?? []).map((p) => p.id);

  const { data: sections } = pageIds.length
    ? await supabase
        .from("site_sections")
        .select("*")
        .in("page_id", pageIds)
        .order("position", { ascending: true })
    : { data: [] };

  const sectionIds = (sections ?? []).map((s) => s.id);

  const { data: fields } = sectionIds.length
    ? await supabase
        .from("site_fields")
        .select("*")
        .in("section_id", sectionIds)
        .order("position", { ascending: true })
    : { data: [] };

  return {
    site: site as Site,
    pages: (pages ?? []).map((page) => ({
      ...page,
      sections: (sections ?? [])
        .filter((s) => s.page_id === page.id)
        .map((section) => ({
          ...section,
          fields: (fields ?? []).filter((f) => f.section_id === section.id) as SiteField[],
        })),
    })),
  };
}

async function getRealContent(siteId: string): Promise<SiteContent | null> {
  const schema = await getSchema(siteId);
  if (!schema) return null;

  const supabase = await createClient();
  const fieldIds = schema.pages.flatMap((p) => p.sections.flatMap((s) => s.fields.map((f) => f.id)));

  const { data: values } = fieldIds.length
    ? await supabase.from("site_field_values").select("*").in("field_id", fieldIds)
    : { data: [] };

  const collectionFieldIds = schema.pages
    .flatMap((p) => p.sections.flatMap((s) => s.fields))
    .filter((f) => f.field_type === "collection")
    .map((f) => f.id);

  const { data: collectionItems } = collectionFieldIds.length
    ? await supabase
        .from("site_collection_items")
        .select("*")
        .in("field_id", collectionFieldIds)
        .order("position", { ascending: true })
    : { data: [] };

  const valuesByField: SiteContent["values"] = {};
  for (const v of values ?? []) {
    valuesByField[v.field_id] = v;
  }

  const itemsByField: SiteContent["collectionItems"] = {};
  for (const item of (collectionItems ?? []) as SiteCollectionItem[]) {
    (itemsByField[item.field_id] ??= []).push(item);
  }

  return { schema, values: valuesByField, collectionItems: itemsByField };
}

async function realSaveFieldDraft(fieldId: string, value: unknown): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_field_values")
    .update({ draft_value: value, updated_at: new Date().toISOString() })
    .eq("field_id", fieldId);

  if (error) throw new Error(error.message);
}

async function realDiscardDraft(siteId: string): Promise<void> {
  const content = await getRealContent(siteId);
  if (!content) return;

  const supabase = await createClient();

  await Promise.all(
    Object.values(content.values).map((value) =>
      supabase
        .from("site_field_values")
        .update({ draft_value: value.published_value, updated_at: new Date().toISOString() })
        .eq("field_id", value.field_id)
    )
  );
}

async function realPublish(siteId: string, actorEmail: string | null): Promise<void> {
  const content = await getRealContent(siteId);
  if (!content) return;

  const supabase = await createClient();
  const now = new Date().toISOString();

  await Promise.all(
    Object.values(content.values).map((value) =>
      supabase
        .from("site_field_values")
        .update({ published_value: value.draft_value, published_at: now, updated_at: now })
        .eq("field_id", value.field_id)
    )
  );

  await supabase.from("sites").update({ status: "published", last_published_at: now }).eq("id", siteId);

  const pageName = content.schema.pages[0]?.name ?? "el sitio";
  await supabase.from("site_change_log").insert({
    site_id: siteId,
    actor_email: actorEmail,
    summary: `${actorEmail ?? "Alguien"} publicó cambios en ${pageName}`,
  });

  revalidatePath("/dashboard/website");
}

async function realGetChangeLog(siteId: string): Promise<SiteChangeLogEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_change_log")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data as SiteChangeLogEntry[]) ?? [];
}

const realAdapter: SiteAdapter = {
  async getSiteForBusiness(businessId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("sites")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return (data as Site) ?? null;
  },
  getContent: getRealContent,
  saveFieldDraft: realSaveFieldDraft,
  discardDraft: realDiscardDraft,
  publish: realPublish,
  getChangeLog: realGetChangeLog,
};

function currentAdapter(): SiteAdapter {
  return IS_DEMO_MODE ? demoSite.adapter : realAdapter;
}

export async function getSiteForBusiness(businessId: string) {
  return currentAdapter().getSiteForBusiness(businessId);
}

export async function getSiteContent(siteId: string) {
  return currentAdapter().getContent(siteId);
}

export async function saveFieldDraft(fieldId: string, value: unknown) {
  return currentAdapter().saveFieldDraft(fieldId, value);
}

export async function discardSiteDraft(siteId: string) {
  return currentAdapter().discardDraft(siteId);
}

export async function publishSite(siteId: string, actorEmail: string | null) {
  return currentAdapter().publish(siteId, actorEmail);
}

export async function getSiteChangeLog(siteId: string) {
  return currentAdapter().getChangeLog(siteId);
}
