import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ websiteId: string; importId: string; path?: string[] }> }) {
  const { websiteId, importId, path } = await params;
  const filePath = path?.join("/");
  if (!filePath || filePath.includes("..")) return new Response("Arquivo inválido.", { status: 400 });
  const supabase = createSupabaseAdminClient();
  const { data: website } = await supabase.from("websites").select("organization_id, active_import_id")
    .eq("id", websiteId).eq("status", "ACTIVE").eq("active_import_id", importId).maybeSingle();
  if (!website) return new Response("Arquivo não encontrado.", { status: 404 });
  const { data: file } = await supabase.from("site_files").select("storage_path, mime_type")
    .eq("organization_id", website.organization_id).eq("website_id", websiteId).eq("import_id", importId).eq("path", filePath).maybeSingle();
  if (!file) return new Response("Arquivo não encontrado.", { status: 404 });
  const { data: blob, error } = await supabase.storage.from("sites").download(file.storage_path);
  if (error || !blob) return new Response("Arquivo não encontrado.", { status: 404 });
  return new Response(await blob.arrayBuffer(), {
    headers: {
      "Content-Type": file.mime_type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
