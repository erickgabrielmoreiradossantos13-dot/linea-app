import { cookies } from "next/headers";
import type { LeadStatus } from "@/lib/types";

const SESSION_COOKIE = "linea_demo_session";
const LEADS_COOKIE = "linea_demo_leads";
const WEBSITE_COOKIE = "linea_demo_website";

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

export interface DemoWebsiteFields {
  headline: string;
  description: string;
  cta_text: string;
  phone: string;
  whatsapp: string;
  published_headline: string;
  published_description: string;
  published_cta_text: string;
  published_phone: string;
  published_whatsapp: string;
  published_at: string;
}

export async function getDemoWebsiteOverrides(): Promise<Partial<DemoWebsiteFields>> {
  const store = await cookies();
  const raw = store.get(WEBSITE_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<DemoWebsiteFields>;
  } catch {
    return {};
  }
}

export async function setDemoWebsiteOverrides(data: Partial<DemoWebsiteFields>) {
  const store = await cookies();
  const current = await getDemoWebsiteOverrides();
  const merged = { ...current, ...data };
  store.set(WEBSITE_COOKIE, JSON.stringify(merged), COOKIE_OPTS);
}
