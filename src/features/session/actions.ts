"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";

export async function logout() {
  if (!isDemoMode) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionContext } from "@/features/session/context";

const schema = z.string().uuid();

export async function switchOrganizationAction(formData: FormData) {
  const parsed = schema.safeParse(formData.get("organizationId"));
  if (!parsed.success) throw new Error("Organización inválida.");

  const session = await getSessionContext();
  const allowed = session.organizations.some((organization) => organization.id === parsed.data);
  if (!allowed) throw new Error("Sem acesso a esta organização.");

  const cookieStore = await cookies();
  cookieStore.set("linea_org", parsed.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/dashboard");
}
