"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionContext } from "@/features/session/context";
import { can } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canManageMembers } from "@/lib/authz";
import { env } from "@/lib/env";

const schema = z.object({
  name: z.string().trim().min(2).max(160),
});

export async function updateOrganizationAction(formData: FormData) {
  const session = await getSessionContext();
  if (!can(session.role, "ADMIN")) return { error: "Sin permiso para editar la organización." };
  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: "El nombre debe tener entre 2 y 160 caracteres." };
  if (session.isDemo) return { error: "La demostración no guarda cambios. Activa tu espacio para trabajar con datos reales." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .update({ name: parsed.data.name, updated_at: new Date().toISOString() })
    .eq("id", session.organizationId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: "No se pudo guardar la organización." };
  revalidatePath("/settings");
  return { success: "Cambios guardados." };
}

const inviteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

export async function inviteOrganizationMember(formData: FormData) {
  const session = await getSessionContext();
  if (!canManageMembers(session.role)) return { error: "Solo el propietario puede invitar miembros." };
  if (session.isDemo) return { error: "La demostración no envía invitaciones." };
  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Revisa el nombre, el email y el rol." };

  const admin = createSupabaseAdminClient();
  const normalizedEmail = parsed.data.email.toLowerCase();
  let userId: string | null = null;
  let invited = false;

  for (let page = 1; page <= 20 && !userId; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return { error: "No se pudo comprobar la cuenta del usuario." };
    userId = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail)?.id ?? null;
    if (data.users.length < 1000) break;
  }

  if (!userId) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: { full_name: parsed.data.name },
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
    });
    if (error || !data.user) return { error: "No se pudo enviar la invitación. Revisa la configuración de correo de Supabase." };
    userId = data.user.id;
    invited = true;
  }

  const { error: memberError } = await admin.from("organization_members").upsert({
    organization_id: session.organizationId,
    user_id: userId,
    role: parsed.data.role,
    status: "ACTIVE",
  }, { onConflict: "organization_id,user_id" });
  if (memberError) return { error: "La cuenta existe, pero no se pudo añadir a esta organización." };

  await admin.from("audit_logs").insert({
    organization_id: session.organizationId,
    actor_user_id: session.userId,
    action: invited ? "organization_member.invited" : "organization_member.added",
    target_type: "user",
    target_id: userId,
    metadata: { email: normalizedEmail, role: parsed.data.role },
  });

  revalidatePath("/settings");
  return {
    success: invited
      ? "Invitación enviada. El miembro tendrá acceso al aceptar el correo."
      : "Usuario añadido. Ya puede entrar con su cuenta existente.",
  };
}
