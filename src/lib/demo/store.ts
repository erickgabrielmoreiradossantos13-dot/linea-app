import { cookies } from "next/headers";
import type { LeadStatus } from "@/lib/types";

const SESSION_COOKIE = "linea_demo_session";
const LEADS_COOKIE = "linea_demo_leads";
const BUSINESS_COOKIE = "linea_demo_business";
const SITE_COOKIE = "linea_demo_site";
const SITE_LOG_COOKIE = "linea_demo_site_log";

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
