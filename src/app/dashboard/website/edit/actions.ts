"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { saveFieldDraft, discardSiteDraft, publishSite, restoreSiteVersion } from "@/lib/site";

export async function saveFieldDraftAction(fieldId: string, value: string) {
  await saveFieldDraft(fieldId, value);
  revalidatePath("/dashboard/website/edit");
}

export async function discardDraftAction(siteId: string) {
  await discardSiteDraft(siteId);
  revalidatePath("/dashboard/website/edit");
}

export async function publishSiteAction(siteId: string) {
  const { userEmail } = await getCurrentBusiness();
  await publishSite(siteId, userEmail);
  revalidatePath("/dashboard/website/edit");
  revalidatePath("/dashboard/website");
  revalidatePath("/dashboard/opportunities");
}

/**
 * Restaura una versión anterior como BORRADOR (no publica automáticamente):
 * el usuario revisa el resultado en el editor y decide si publicarlo.
 */
export async function restoreVersionAction(siteId: string, snapshot: Record<string, unknown>) {
  await restoreSiteVersion(siteId, snapshot);
  revalidatePath("/dashboard/website/edit");
}
