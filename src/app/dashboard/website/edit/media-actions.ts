"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET } from "@/lib/media-constants";

export interface RegisterMediaInput {
  businessId: string;
  storagePath: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
}

export async function registerMediaAsset(input: RegisterMediaInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("media_assets").insert({
    business_id: input.businessId,
    storage_path: input.storagePath,
    url: input.url,
    filename: input.filename,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    width: input.width,
    height: input.height,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/website/edit");
}

export async function deleteMediaAsset(assetId: string, storagePath: string) {
  const supabase = await createClient();
  await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
  const { error } = await supabase.from("media_assets").delete().eq("id", assetId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/website/edit");
}
