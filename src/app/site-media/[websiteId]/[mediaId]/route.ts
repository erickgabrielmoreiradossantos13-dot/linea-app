import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ websiteId: string; mediaId: string }> }) {
  const { websiteId, mediaId } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: website } = await supabase.from("websites").select("organization_id").eq("id", websiteId).eq("status", "ACTIVE").maybeSingle();
  if (!website) return new Response("Imagem não encontrada.", { status: 404 });
  const { data: media } = await supabase.from("media").select("storage_path, mime_type")
    .eq("id", mediaId).eq("organization_id", website.organization_id).or(`website_id.eq.${websiteId},website_id.is.null`).is("deleted_at", null).maybeSingle();
  if (!media) return new Response("Imagem não encontrada.", { status: 404 });
  const { data: blob, error } = await supabase.storage.from("media").download(media.storage_path);
  if (error || !blob) return new Response("Imagem não encontrada.", { status: 404 });
  return new Response(await blob.arrayBuffer(), {
    headers: { "Content-Type": media.mime_type, "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" },
  });
}
