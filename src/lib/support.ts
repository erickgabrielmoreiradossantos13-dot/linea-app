import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";
import { DEMO_SUPPORT_REQUESTS } from "@/lib/demo/data";
import {
  getDemoExtraSupportRequests,
  addDemoSupportRequest,
  getDemoSupportComments,
  addDemoSupportComment,
} from "@/lib/demo/store";
import type { SupportCategory, SupportComment, SupportPriority, SupportRequest } from "@/lib/types";

export interface CreateSupportRequestInput {
  title: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
}

export async function getSupportRequests(businessId: string): Promise<SupportRequest[]> {
  if (IS_DEMO_MODE) {
    const extra = await getDemoExtraSupportRequests();
    return [...extra, ...DEMO_SUPPORT_REQUESTS].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("support_requests")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  return (data as SupportRequest[]) ?? [];
}

export async function createSupportRequest(
  businessId: string,
  input: CreateSupportRequestInput
): Promise<void> {
  if (IS_DEMO_MODE) {
    const now = new Date().toISOString();
    await addDemoSupportRequest({
      id: `demo-support-${Date.now()}`,
      business_id: businessId,
      created_by: null,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      status: "recibida",
      response_notes: null,
      created_at: now,
      updated_at: now,
    });
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("support_requests").insert({
    business_id: businessId,
    created_by: user?.id ?? null,
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority,
  });

  if (error) throw new Error(error.message);
}

export async function getSupportRequestById(businessId: string, requestId: string): Promise<SupportRequest | null> {
  if (IS_DEMO_MODE) {
    const all = await getSupportRequests(businessId);
    return all.find((r) => r.id === requestId) ?? null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("support_requests")
    .select("*")
    .eq("business_id", businessId)
    .eq("id", requestId)
    .maybeSingle();

  return (data as SupportRequest) ?? null;
}

export async function getSupportComments(businessId: string, requestId: string): Promise<SupportComment[]> {
  if (IS_DEMO_MODE) {
    const all = await getDemoSupportComments();
    return all[requestId] ?? [];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("support_comments")
    .select("*")
    .eq("business_id", businessId)
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  return (data as SupportComment[]) ?? [];
}

export async function addSupportComment(
  businessId: string,
  requestId: string,
  comment: string,
  authorEmail: string | null,
  isStaff: boolean
): Promise<void> {
  if (IS_DEMO_MODE) {
    await addDemoSupportComment({
      id: `demo-comment-${Date.now()}`,
      request_id: requestId,
      business_id: businessId,
      author_email: authorEmail,
      is_staff: isStaff,
      comment,
      created_at: new Date().toISOString(),
    });
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("support_comments").insert({
    business_id: businessId,
    request_id: requestId,
    author_email: authorEmail,
    is_staff: isStaff,
    comment,
  });

  if (error) throw new Error(error.message);
}
