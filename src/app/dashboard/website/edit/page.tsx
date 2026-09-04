import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { getSiteForBusiness, getSiteContent, getSiteChangeLog } from "@/lib/site";
import { getMediaAssets } from "@/lib/media";
import { EditorShell } from "@/components/editor/editor-shell";

export const metadata: Metadata = {
  title: "Editar web · Línea App",
};

export const dynamic = "force-dynamic";

export default async function WebsiteEditPage() {
  const { business } = await getCurrentBusiness();
  const site = await getSiteForBusiness(business.id);

  if (!site) notFound();

  const [content, changeLog, mediaAssets] = await Promise.all([
    getSiteContent(site.id),
    getSiteChangeLog(site.id),
    getMediaAssets(business.id),
  ]);

  if (!content) notFound();

  const initialValues: Record<string, { draft: string; published: string }> = {};
  for (const [fieldId, value] of Object.entries(content.values)) {
    initialValues[fieldId] = {
      draft: String(value.draft_value ?? ""),
      published: String(value.published_value ?? ""),
    };
  }

  return (
    <EditorShell
      businessId={business.id}
      businessName={business.name}
      schema={content.schema}
      initialValues={initialValues}
      changeLog={changeLog}
      mediaAssets={mediaAssets}
    />
  );
}
