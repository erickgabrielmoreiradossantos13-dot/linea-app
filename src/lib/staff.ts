import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/demo/config";

/**
 * Equipo interno de Línea Sur: acceso cruzado a todos los negocios para
 * gestionar sitios (/dashboard/admin/sites). En modo demo siempre es `true`
 * para poder enseñar esa pantalla también sin Supabase conectado.
 */
export async function isLineaStaff(): Promise<boolean> {
  if (IS_DEMO_MODE) {
    return true;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("linea_staff")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return !!data;
}
