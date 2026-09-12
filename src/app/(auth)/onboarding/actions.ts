"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(2).max(160),
});

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createOrganizationAction(formData: FormData) {
  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) throw new Error("Nombre da empresa inválido.");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const baseSlug = slugify(parsed.data.name) || "empresa";
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;

  const { data, error } = await supabase.rpc("create_organization_for_current_user", {
    org_name: parsed.data.name,
    org_slug: slug,
  });

  if (error || !data) throw new Error("No se pudo criar a organização.");
  redirect("/dashboard");
}
