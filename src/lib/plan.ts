import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { DEMO_IMPROVEMENT_PLAN } from "@/lib/demo/data";
import type { ImprovementPlanItem } from "@/lib/types";

export async function getImprovementPlan(businessId: string): Promise<ImprovementPlanItem[]> {
  if (IS_DEMO_MODE) {
    return DEMO_IMPROVEMENT_PLAN;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("improvement_plan_items")
    .select("*")
    .eq("business_id", businessId)
    .order("position", { ascending: true });

  return (data as ImprovementPlanItem[]) ?? [];
}
