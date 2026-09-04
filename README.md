# Línea App

Panel de gestión para negocios de Línea Sur, pensado para que un propietario de
negocio local (no un marketer) entienda en segundos si su presencia digital le está
trayendo clientes: oportunidades, de dónde vienen, qué está funcionando y qué hacer
después.

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
   - `supabase/migrations/0003_growth_plan.sql` (valor comercial, Google Maps como
     fuente de tráfico, y la tabla del Plan de mejora)

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

- El negocio demo **Clínica Aurora** (Málaga), marcado con `is_demo = true`, con valor
  medio de cliente, tasa de cierre y próxima revisión ya configurados.
- Un usuario de acceso: **`demo@lineasur.app`** / **`LineaDemo2026!`**.
- Contenido de la web, ~2.418 visitas y 83 leads del periodo actual (últimos 30 días),
  más un segundo lote más pequeño en el periodo anterior (30-59 días) para que las
  comparaciones "vs. mes anterior" funcionen también en modo Supabase real.
- 5 tareas de ejemplo en el Plan de mejora, con los tres estados posibles.

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
| `businesses` | Negocios (tenants). Incluye `linea_score`, y la configuración de valor comercial (`avg_client_value`, `close_rate`, `next_review_date`). |
| `business_members` | Relación usuario ↔ negocio, con rol `client` o `admin`. |
| `leads` | Contactos recibidos (WhatsApp, formulario, llamada) con estado del embudo. |
| `website_content` | Contenido editable de la web (borrador + última publicación). |
| `analytics_events` | Visitas registradas, con su fuente de tráfico (incluye `google_maps`). |
| `improvement_plan_items` | Tareas del Plan de mejora que Línea Sur gestiona para cada cliente (el cliente solo lee). |

Multi-tenant: cada usuario pertenece a un `business` a través de `business_members`.
Row Level Security garantiza que un usuario solo puede leer/actualizar los datos
de su propio negocio.

## Páginas

- `/login` — Inicio de sesión.
- `/dashboard` (**Inicio**) — Saludo + resumen, 4 KPIs con comparación vs. mes anterior,
  oportunidades destacadas, evolución (gráfico, acciones comerciales, cómo llegan tus
  clientes), valor comercial potencial y Línea Score.
- `/dashboard/opportunities` (**Oportunidades**) — Recomendaciones automáticas (motor de
  reglas, no IA) generadas a partir de datos reales: conversión a la baja, contactos sin
  gestionar, crecimiento de oportunidades, etc.
- `/dashboard/leads` (**Contactos**) — Listado de leads con cambio de estado en línea.
- `/dashboard/google` (**Google**) — Visibilidad en búsquedas de Google. **Sin
  integración real todavía**: en modo demo muestra datos ilustrativos claramente
  marcados; en modo Supabase real muestra un aviso de "aún no conectado" en vez de
  inventar cifras.
- `/dashboard/website` (**Web**) — Editor de título, descripción, botón, teléfono y
  WhatsApp, con vista previa.
- `/dashboard/plan` (**Plan de mejora**) — Checklist de solo lectura de las tareas que
  Línea Sur está trabajando para el negocio, con próxima fecha de revisión.
- `/dashboard/reports` (**Informes**) — Resumen del periodo actual vs. el anterior
  (reutiliza las mismas métricas; la exportación a PDF queda pendiente).
- `/dashboard/settings` (**Configuración**) — Valor medio de cliente y tasa de cierre
  estimada, usados para calcular el valor comercial potencial.

## Qué es real y qué es demo/pendiente

Para que ningún número parezca real sin serlo:

- **Real siempre** (en modo demo y en modo Supabase): oportunidades, visitas,
  conversión, acciones comerciales, fuentes de tráfico, Plan de mejora, valor comercial
  potencial. Las comparaciones "vs. mes anterior" se calculan contra los 30 días previos.
- **No conectado en modo real / ilustrativo en modo demo**: la sección **Google**
  (Search Console no está integrado). En modo real se muestra un estado "conecta
  Google" en vez de datos inventados; en modo demo se muestran cifras de ejemplo
  claramente etiquetadas.
- Las tarjetas de "Oportunidad SEO" en `/dashboard/opportunities` que hacen referencia a
  una página o búsqueda concreta son **ejemplos ilustrativos, solo en modo demo**
  (llevan la etiqueta "Ejemplo ilustrativo"): requieren analítica por página y Search
  Console, que todavía no existen. El resto de tarjetas de esa página sí se generan con
  datos reales del negocio.
- No se han añadido "Reservas" ni "Solicitudes de presupuesto" como canales de contacto
  reales porque hoy no existe ninguna integración que genere ese tipo de lead.

## Pendiente para una V1

Integración real con Google Search Console (visibilidad, consultas), atribución de
cada lead a su fuente de tráfico de origen, analítica por página, exportación de
informes en PDF, edición del Plan de mejora desde un panel interno de Línea Sur, IA,
CRM avanzado, automatizaciones, envío de emails, API de WhatsApp, reservas,
facturación/Stripe, roles avanzados, PageSpeed, gestor de imágenes, constructor
visual, notificaciones y tests exhaustivos quedan fuera de esta versión a propósito.
