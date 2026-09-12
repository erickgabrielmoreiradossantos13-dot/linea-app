export type Role = "SUPER_ADMIN" | "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "MEETING" | "PROPOSAL" | "WON" | "LOST";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: "LITE" | "GROWTH" | "PRO";
};

export type Lead = {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: string;
  page: string;
  message?: string;
  status: LeadStatus;
  createdAt: string;
};

export type Metric = {
  label: string;
  value: string;
  delta: string;
  hint: string;
};
