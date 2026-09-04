import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import type { MediaAsset } from "@/lib/types";

export { MEDIA_BUCKET } from "@/lib/media-constants";

/** En modo demo no hay Storage real: la biblioteca solo vive en la sesión del navegador. */
export async function getMediaAssets(businessId: string): Promise<MediaAsset[]> {
  if (IS_DEMO_MODE) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("media_assets")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(60);

  return (data as MediaAsset[]) ?? [];
}
