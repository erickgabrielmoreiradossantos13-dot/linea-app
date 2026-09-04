# Línea App · V0

Panel de gestión para negocios de Línea Sur. Versión funcional mínima con 4 funciones:
inicio de sesión, dashboard de métricas, gestión de leads y editor básico del sitio web.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + Database + RLS) · Recharts · Vercel.

## Modo demo (sin Supabase configurado)

Si las variables `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` **no** están
configuradas, la app arranca automáticamente en **modo demo**: usa datos de ejemplo
generados en el propio código (mismo negocio, leads y contenido que el seed real) y una
sesión basada en cookies, sin necesidad de base de datos. Así se puede desplegar y enseñar
de inmediato, y conectar Supabase más adelante sin tocar ningún componente.

- Credenciales de acceso: **`demo@lineasur.app`** / **`LineaDemo2026!`**
- Los cambios de estado de un lead y las publicaciones del editor web se guardan en
  cookies del navegador (persisten mientras no se borren, pero no son una base de datos real).
- En cuanto añadas las dos variables de Supabase (local o en Vercel) y vuelvas a desplegar,
  la app pasa a usar Supabase real de forma automática.

## 1. Instalación

```bash
npm install
```

## 2. Variables de entorno (opcional mientras estés en modo demo)

Copia el archivo de ejemplo y rellena los valores de tu proyecto Supabase
(**Project Settings → API**) cuando estés list@ para dejar el modo demo:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## 3. Conectar Supabase y ejecutar las migrations

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre el **SQL Editor** del proyecto.
3. Ejecuta, en este orden, el contenido de:
   - `supabase/migrations/0001_schema.sql` (tablas)
   - `supabase/migrations/0002_rls.sql` (Row Level Security)

   También puedes usar la Supabase CLI si la tienes instalada:

   ```bash
   supabase link --project-ref TU_PROJECT_REF
   supabase db push
   ```

## 4. Cargar los datos de demo (seed)

Ejecuta `supabase/seed.sql` en el **SQL Editor** de Supabase (necesita permisos
sobre `auth.users`, por lo que debe lanzarse desde el SQL Editor del panel o
con `supabase db execute -f supabase/seed.sql`, nunca desde el cliente público).

Esto crea:

- El negocio demo **Clínica Aurora** (Málaga), marcado con `is_demo = true`.
- Un usuario de acceso: **`demo@lineasur.app`** / **`LineaDemo2026!`**.
- Contenido de la web, ~2.418 visitas y 83 leads (WhatsApp, formulario, llamada)
  distribuidos en los últimos 30 días, también marcados con `is_demo = true`.

El seed es idempotente: se puede volver a ejecutar sin duplicar datos.

## 5. Ejecutar en local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) e inicia sesión con el usuario demo.

## 6. Desplegar en Vercel

1. Sube el proyecto a un repositorio Git (GitHub/GitLab/Bitbucket).
2. Importa el repositorio en [vercel.com](https://vercel.com).
3. Despliega sin variables de entorno: el proyecto arranca en **modo demo** (ver arriba)
   y es plenamente funcional para enseñarlo a clientes.
4. Cuando conectes Supabase de verdad, añade `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` en **Project Settings → Environment Variables** y
   vuelve a desplegar (Redeploy). La app pasa a usar datos reales automáticamente.

## Estructura de la base de datos

| Tabla | Descripción |
|---|---|
| `businesses` | Negocios (tenants). Incluye `linea_score` (0–100). |
| `business_members` | Relación usuario ↔ negocio, con rol `client` o `admin`. |
| `leads` | Contactos recibidos (WhatsApp, formulario, llamada) con estado del embudo. |
| `website_content` | Contenido editable de la web (borrador + última publicación). |
| `analytics_events` | Visitas registradas, con su fuente de tráfico. |

Multi-tenant: cada usuario pertenece a un `business` a través de `business_members`.
Row Level Security garantiza que un usuario solo puede leer/actualizar los datos
de su propio negocio.

## Páginas

- `/login` — Inicio de sesión (Supabase Auth).
- `/dashboard` — Métricas, gráfico de oportunidades, canales, fuentes de tráfico y Línea Score.
- `/dashboard/leads` — Listado de leads con cambio de estado en línea.
- `/dashboard/website` — Editor de título, descripción, botón, teléfono y WhatsApp, con vista previa.

## Pendiente para una V1

Integraciones con Google Analytics/Search Console, IA, CRM avanzado, automatizaciones,
envío de emails, API de WhatsApp, reservas, facturación/Stripe, roles avanzados,
recomendaciones automáticas, PageSpeed/SEO avanzado, gestor de imágenes, constructor
visual, notificaciones y tests exhaustivos quedan fuera de esta V0 a propósito.
