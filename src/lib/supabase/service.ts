import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role: omite RLS por diseño. Solo se usa dentro de
 * Route Handlers públicos de ingesta (/api/track, /api/lead), donde no hay
 * sesión de usuario pero sí hace falta escribir en `analytics_events`/`leads`
 * atribuidos a un negocio concreto. Nunca se importa desde un Client
 * Component ni se expone como NEXT_PUBLIC_*.
 *
 * Si SUPABASE_SERVICE_ROLE_KEY no está configurada (proyecto sin Supabase
 * real todavía), devuelve null en vez de lanzar: la ruta que lo llama debe
 * responder con un error claro, no tumbar el proceso.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
