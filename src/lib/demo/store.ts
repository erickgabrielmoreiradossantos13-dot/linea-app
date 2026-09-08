import { cookies } from "next/headers";
import type { Lead, LeadNote, LeadStatus, SupportComment, SupportRequest } from "@/lib/types";

const SESSION_COOKIE = "linea_demo_session";
const LEADS_COOKIE = "linea_demo_leads";
const BUSINESS_COOKIE = "linea_demo_business";
const SITE_COOKIE = "linea_demo_site";
const SITE_LOG_COOKIE = "linea_demo_site_log";
const SUPPORT_COOKIE = "linea_demo_support";
const LEAD_NOTES_COOKIE = "linea_demo_lead_notes";
const EXTRA_LEADS_COOKIE = "linea_demo_extra_leads";
const INTEGRATIONS_COOKIE = "linea_demo_integrations";
const SUPPORT_COMMENTS_COOKIE = "linea_demo_support_comments";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function hasDemoSession(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === "active";
}

export async function setDemoSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "active", COOKIE_OPTS);
}

export async function clearDemoSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getDemoLeadOverrides(): Promise<Record<string, LeadStatus>> {
  const store = await cookies();
  const raw = store.get(LEADS_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, LeadStatus>;
  } catch {
    return {};
  }
}

export async function setDemoLeadOverride(leadId: string, status: LeadStatus) {
  const store = await cookies();
  const current = await getDemoLeadOverrides();
  current[leadId] = status;
  store.set(LEADS_COOKIE, JSON.stringify(current), COOKIE_OPTS);
}

export interface DemoSiteOverrides {
  draft: Record<string, string>;
  published: Record<string, string>;
  lastPublishedAt: string | null;
}

export async function getDemoSiteOverrides(): Promise<DemoSiteOverrides> {
  const store = await cookies();
  const raw = store.get(SITE_COOKIE)?.value;
  const fallback: DemoSiteOverrides = { draft: {}, published: {}, lastPublishedAt: null };
  if (!raw) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(raw) as Partial<DemoSiteOverrides>) };
  } catch {
    return fallback;
  }
}

export async function setDemoSiteOverrides(patch: {
  draft?: Record<string, string>;
  published?: Record<string, string>;
  lastPublishedAt?: string;
}) {
  const store = await cookies();
  const current = await getDemoSiteOverrides();
  const merged: DemoSiteOverrides = {
    draft: { ...current.draft, ...patch.draft },
    published: { ...current.published, ...patch.published },
    lastPublishedAt: patch.lastPublishedAt ?? current.lastPublishedAt,
  };
  store.set(SITE_COOKIE, JSON.stringify(merged), COOKIE_OPTS);
}

export interface DemoChangeLogEntry {
  summary: string;
  created_at: string;
  snapshot: Record<string, string>;
}

export async function getDemoSiteChangeLog(): Promise<DemoChangeLogEntry[]> {
  const store = await cookies();
  const raw = store.get(SITE_LOG_COOKIE)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DemoChangeLogEntry[];
  } catch {
    return [];
  }
}

export async function addDemoSiteChangeLogEntry(entry: DemoChangeLogEntry) {
  const store = await cookies();
  const current = await getDemoSiteChangeLog();
  const updated = [entry, ...current].slice(0, 10);
  store.set(SITE_LOG_COOKIE, JSON.stringify(updated), COOKIE_OPTS);
}

export interface DemoBusinessFields {
  avg_client_value: number | null;
  close_rate: number;
}

export async function getDemoBusinessOverrides(): Promise<Partial<DemoBusinessFields>> {
  const store = await cookies();
  const raw = store.get(BUSINESS_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<DemoBusinessFields>;
  } catch {
    return {};
  }
}

export async function setDemoBusinessOverrides(data: Partial<DemoBusinessFields>) {
  const store = await cookies();
  const current = await getDemoBusinessOverrides();
  const merged = { ...current, ...data };
  store.set(BUSINESS_COOKIE, JSON.stringify(merged), COOKIE_OPTS);
}

export async function getDemoExtraSupportRequests(): Promise<SupportRequest[]> {
  const store = await cookies();
  const raw = store.get(SUPPORT_COOKIE)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SupportRequest[];
  } catch {
    return [];
  }
}

export async function addDemoSupportRequest(request: SupportRequest) {
  const store = await cookies();
  const current = await getDemoExtraSupportRequests();
  const updated = [request, ...current].slice(0, 20);
  store.set(SUPPORT_COOKIE, JSON.stringify(updated), COOKIE_OPTS);
}

export async function getDemoLeadNotes(): Promise<Record<string, LeadNote[]>> {
  const store = await cookies();
  const raw = store.get(LEAD_NOTES_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, LeadNote[]>;
  } catch {
    return {};
  }
}

export async function addDemoLeadNote(note: LeadNote) {
  const store = await cookies();
  const current = await getDemoLeadNotes();
  const forLead = [note, ...(current[note.lead_id] ?? [])].slice(0, 30);
  const updated = { ...current, [note.lead_id]: forLead };
  store.set(LEAD_NOTES_COOKIE, JSON.stringify(updated), COOKIE_OPTS);
}

export async function getDemoExtraLeads(): Promise<Lead[]> {
  const store = await cookies();
  const raw = store.get(EXTRA_LEADS_COOKIE)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Lead[];
  } catch {
    return [];
  }
}

export async function addDemoExtraLead(lead: Lead) {
  const store = await cookies();
  const current = await getDemoExtraLeads();
  const updated = [lead, ...current].slice(0, 50);
  store.set(EXTRA_LEADS_COOKIE, JSON.stringify(updated), COOKIE_OPTS);
}

interface DemoIntegrations {
  ga4_measurement_id: string | null;
  gtm_container_id: string | null;
  google_ads_conversion_id: string | null;
  meta_pixel_id: string | null;
}

export async function getDemoIntegrationSettings(): Promise<Partial<DemoIntegrations>> {
  const store = await cookies();
  const raw = store.get(INTEGRATIONS_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<DemoIntegrations>;
  } catch {
    return {};
  }
}

export async function setDemoIntegrationSettings(data: DemoIntegrations) {
  const store = await cookies();
  store.set(INTEGRATIONS_COOKIE, JSON.stringify(data), COOKIE_OPTS);
}

export async function getDemoSupportComments(): Promise<Record<string, SupportComment[]>> {
  const store = await cookies();
  const raw = store.get(SUPPORT_COMMENTS_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, SupportComment[]>;
  } catch {
    return {};
  }
}

export async function addDemoSupportComment(comment: SupportComment) {
  const store = await cookies();
  const current = await getDemoSupportComments();
  const forRequest = [...(current[comment.request_id] ?? []), comment];
  const updated = { ...current, [comment.request_id]: forRequest };
  store.set(SUPPORT_COMMENTS_COOKIE, JSON.stringify(updated), COOKIE_OPTS);
}
