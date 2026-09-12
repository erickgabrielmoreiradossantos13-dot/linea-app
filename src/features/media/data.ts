import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/features/session/context";

export type MediaItem = {
  id: string;
  filename: string;
  mimeType: string;
  bytes: number;
  altText: string | null;
  previewUrl: string | null;
  createdAt: string;
};

export async function getMedia(session: SessionContext): Promise<MediaItem[]> {
  if (session.isDemo) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("media")
    .select("id, filename, mime_type, bytes, alt_text, storage_path, created_at")
    .eq("organization_id", session.organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("No se pudo carregar a biblioteca.");
  const { data: signed } = await supabase.storage
    .from("media")
    .createSignedUrls((data ?? []).map((row) => row.storage_path), 60 * 60);
  return (data ?? []).map((row, index) => ({
    id: row.id, filename: row.filename, mimeType: row.mime_type,
    bytes: Number(row.bytes), altText: row.alt_text,
    previewUrl: signed?.[index]?.signedUrl ?? null,
    createdAt: row.created_at,
  }));
}
