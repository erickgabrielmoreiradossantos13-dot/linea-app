"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { setDemoWebsiteOverrides } from "@/lib/demo/store";

export interface WebsiteContentInput {
  businessId: string;
  headline: string;
  description: string;
  ctaText: string;
  phone: string;
  whatsapp: string;
}

export async function saveDraft(input: WebsiteContentInput) {
  if (IS_DEMO_MODE) {
    await setDemoWebsiteOverrides({
      headline: input.headline,
      description: input.description,
      cta_text: input.ctaText,
      phone: input.phone,
      whatsapp: input.whatsapp,
    });
    revalidatePath("/dashboard/website");
    return;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("website_content")
    .update({
      headline: input.headline,
      description: input.description,
      cta_text: input.ctaText,
      phone: input.phone,
      whatsapp: input.whatsapp,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", input.businessId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/website");
}

export async function publishContent(input: WebsiteContentInput) {
  const now = new Date().toISOString();

  if (IS_DEMO_MODE) {
    await setDemoWebsiteOverrides({
      headline: input.headline,
      description: input.description,
      cta_text: input.ctaText,
      phone: input.phone,
      whatsapp: input.whatsapp,
      published_headline: input.headline,
      published_description: input.description,
      published_cta_text: input.ctaText,
      published_phone: input.phone,
      published_whatsapp: input.whatsapp,
      published_at: now,
    });
    revalidatePath("/dashboard/website");
    return;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("website_content")
    .update({
      headline: input.headline,
      description: input.description,
      cta_text: input.ctaText,
      phone: input.phone,
      whatsapp: input.whatsapp,
      published_headline: input.headline,
      published_description: input.description,
      published_cta_text: input.ctaText,
      published_phone: input.phone,
      published_whatsapp: input.whatsapp,
      updated_at: now,
      published_at: now,
    })
    .eq("business_id", input.businessId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/website");
}
