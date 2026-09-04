"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/supabase/business";
import { saveFieldDraft, discardSiteDraft, publishSite } from "@/lib/site";

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
