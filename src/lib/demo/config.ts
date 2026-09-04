/**
 * Modo demo: se activa automáticamente cuando el proyecto todavía no tiene
 * configuradas las variables de Supabase (típicamente en el primer deploy
 * a Vercel, antes de conectar la base de datos real).
 *
 * En cuanto se configuren NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (y se vuelva a desplegar), la app usa Supabase real automáticamente:
 * no hace falta tocar ningún componente ni página.
 */
export const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
