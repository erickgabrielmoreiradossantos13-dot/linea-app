import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { getDemoIntegrationSettings, setDemoIntegrationSettings } from "@/lib/demo/store";
import type { IntegrationSettings } from "@/lib/types";

const EMPTY: Omit<IntegrationSettings, "business_id" | "updated_at"> = {
  ga4_measurement_id: null,
  gtm_container_id: null,
  google_ads_conversion_id: null,
  meta_pixel_id: null,
};

export interface IntegrationInput {
  ga4_measurement_id: string | null;
  gtm_container_id: string | null;
  google_ads_conversion_id: string | null;
  meta_pixel_id: string | null;
}

export async function getIntegrationSettings(businessId: string): Promise<IntegrationSettings> {
  if (IS_DEMO_MODE) {
    const overrides = await getDemoIntegrationSettings();
    return {
      business_id: businessId,
      updated_at: new Date().toISOString(),
      ...EMPTY,
      ...overrides,
    };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("integration_settings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  if (data) return data as IntegrationSettings;

  return { business_id: businessId, updated_at: new Date().toISOString(), ...EMPTY };
}

export async function saveIntegrationSettings(businessId: string, input: IntegrationInput): Promise<void> {
  if (IS_DEMO_MODE) {
    await setDemoIntegrationSettings(input);
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("integration_settings")
    .upsert({ business_id: businessId, ...input }, { onConflict: "business_id" });

  if (error) throw new Error(error.message);
}
