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
   - `supabase/migrations/0004_sites_editor.sql` (Site / Editable Schema / editor por
     secciones, equipo interno de Línea Sur, y el bucket de Storage para imágenes)
   - `supabase/migrations/0005_v0_1.sql` (Plan de mejora enriquecido, Solicitudes/soporte,
     atribución básica de leads y snapshot de publicación para restaurar versiones)

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
- 5 tareas de ejemplo en el Plan de mejora, con categoría, prioridad, impacto y los
  cinco estados del flujo (Recomendado/Planificado/En progreso/Completado/Descartado).
- 3 solicitudes de ejemplo en Solicitudes, en distintos estados.
- Atribución básica (fuente de tráfico, página de aterrizaje) en cada lead de ejemplo.
- El **sitio** de Clínica Aurora en la nueva arquitectura de Editable Schema (página
  "Inicio" → secciones "Hero" y "Contacto" con sus campos), con el mismo contenido que
  antes tenía `website_content`. El usuario demo se añade también a `linea_staff` para
  poder enseñar `/dashboard/admin/sites`.

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
| `leads` | Contactos recibidos (WhatsApp, formulario, llamada) con estado del embudo, más atribución básica (`traffic_source`, `traffic_medium`, `campaign`, `landing_page`, `referrer`). |
| `website_content` | Contenido editable de la web (borrador + última publicación). |
| `analytics_events` | Visitas registradas, con su fuente de tráfico (incluye `google_maps`). |
| `improvement_plan_items` | Tareas del Plan de mejora que Línea Sur gestiona para cada cliente (el cliente solo lee). Incluye `category`, `priority`, `description`, `impact`, `target_date` y `result`. |
| `support_requests` | Solicitudes que el cliente envía a Línea Sur (cambio de contenido, nueva sección, problema técnico...). El cliente crea y lee las suyas; solo `linea_staff` cambia el estado o añade `response_notes`. |
| `sites` | Un sitio web conectado a Línea App (uno o varios por negocio). |
| `site_pages` / `site_sections` / `site_fields` | El **Editable Schema**: qué páginas, secciones y campos existen, de qué tipo, y si el cliente puede editarlos (`editable_by_client`). Lo define Línea Sur. |
| `site_field_values` / `site_collection_items` | El contenido en sí (borrador + publicado) de cada campo simple o de cada elemento de una colección (servicios, testimonios...). |
| `site_change_log` | Historial de cambios de un sitio, con `snapshot` (valores publicados en ese momento) para poder restaurar una versión anterior como borrador. |
| `media_assets` | Biblioteca de imágenes de cada negocio (Supabase Storage, bucket `site-media`). |
| `linea_staff` | Equipo interno de Línea Sur con acceso a `/dashboard/admin/sites` y a todos los negocios. |

`website_content` (tabla del editor simple original) se deja intacta en la base de datos
por compatibilidad, pero ya no la usa ninguna pantalla: su contenido se migró al Editable
Schema en el seed.

Multi-tenant: cada usuario pertenece a un `business` a través de `business_members`.
Row Level Security garantiza que un usuario solo puede leer/actualizar los datos
de su propio negocio.

## Páginas

- `/login` — Inicio de sesión.
- `/dashboard` (**Inicio**, grupo *Resumen*) — Saludo + badge de "Datos de demostración"
  cuando corresponde, 4 KPIs con comparación vs. mes anterior y una microexplicación de
  qué significa cada uno, **"Qué necesita tu atención"** (insights accionables con
  impacto comercial y CTA a la sección relevante), gráfico de oportunidades, cómo llegan
  los clientes, acciones comerciales, **"Tu web está evolucionando"** (resumen del Plan
  de mejora: completado / en progreso / siguiente), valor comercial potencial y Línea
  Score.
- `/dashboard/opportunities` (**Oportunidades**, grupo *Resultados*) — Recomendaciones
  automáticas (motor de reglas, no IA) generadas a partir de datos reales: conversión a
  la baja, contactos sin gestionar, crecimiento de oportunidades, etc. Cada una enlaza a
  dónde se puede actuar (Mi Web, Contactos, Informes).
- `/dashboard/leads` (**Contactos**, grupo *Resultados*) — Listado de leads con filtro por
  estado (también enlazable por URL, `?status=nuevo`), cambio de estado en línea, ficha
  de contacto (`/dashboard/leads/[id]`) con acciones Llamar/WhatsApp/Email, y un panel de
  **atribución básica**: de dónde llegan los contactos y qué página genera más.
- `/dashboard/google` (**Google**, grupo *Resultados*) — Visibilidad en búsquedas de
  Google (**sin integración real todavía**: en modo demo muestra datos ilustrativos
  claramente marcados; en modo Supabase real muestra un aviso de "aún no conectado" en
  vez de inventar cifras), más checklists reales de **SEO local** y **preparación para
  IA (GEO)** derivadas del contenido publicado, y las próximas acciones del Plan de
  mejora relacionadas.
- `/dashboard/reports` (**Informes**, grupo *Resultados*) — Informe mensual: resultados,
  oportunidades a destacar, páginas que mejor funcionaron (según atribución), Google/SEO,
  mejoras realizadas y próximas acciones. Incluye "Imprimir / Guardar como PDF" (vista
  print-friendly); la generación automática mensual queda pendiente.
- `/dashboard/plan` (**Plan de mejora**, grupo *Crecimiento*) — Qué recomendamos → qué
  estamos haciendo → qué hemos terminado, agrupado por estado, con categoría, prioridad,
  impacto esperado, fecha prevista y resultado al completarse.
- `/dashboard/support` (**Solicitudes**, grupo *Crecimiento*) — El cliente pide cambios de
  contenido, nuevas secciones, ayuda técnica, etc. Ve sus solicitudes abiertas y
  resueltas, con las notas de respuesta de Línea Sur cuando existen.
- `/dashboard/website` (**Mi Web**, grupo *Tu web*) — Resumen del sitio conectado
  (nombre, dominio, estado, última actualización) con accesos a Editar web / Ver web /
  Vista previa.
- `/dashboard/website/edit` — Editor por secciones, genérico y controlado por el
  Editable Schema (no hardcodea "Clínica Aurora"): árbol de páginas/secciones, formulario
  de campos, vista previa con selector Desktop/Tablet/Móvil y **edición visual**: pasar el
  cursor sobre un texto/CTA/teléfono de la preview lo resalta, y al hacer clic se abre y
  resalta su campo en el formulario (sin publicar nada automáticamente). Borrador con
  contador de cambios sin publicar, Publicar/Descartar, historial de cambios con
  **"Restaurar esta versión"** (carga el snapshot como borrador para revisar antes de
  publicar, nunca sobrescribe producción directamente) y biblioteca de imágenes básica.
- `/dashboard/admin/sites` (**Sitios (equipo)**, grupo *Equipo*) — Solo visible para
  `linea_staff`. Lista los sitios conectados y permite añadir uno nuevo (nombre, negocio,
  dominio, URLs). Configurar su esquema (páginas/secciones/campos editables) se hace por
  SQL, a propósito: no hay todavía un constructor visual de esquemas.
- `/dashboard/settings` (**Configuración**, grupo *Cuenta*) — Valor medio de cliente y
  tasa de cierre estimada, usados para calcular el valor comercial potencial.

## Qué es real y qué es demo/pendiente

Para que ningún número parezca real sin serlo:

- **Real siempre** (en modo demo y en modo Supabase): oportunidades, visitas,
  conversión, acciones comerciales, fuentes de tráfico, atribución de leads (fuente y
  página de origen), Plan de mejora, Solicitudes, valor comercial potencial. Las
  comparaciones "vs. mes anterior" se calculan contra los 30 días previos.
- **No conectado en modo real / ilustrativo en modo demo**: la sección **Google**
  (Search Console no está integrado). En modo real se muestra un estado "conecta
  Google" en vez de datos inventados; en modo demo se muestran cifras de ejemplo
  claramente etiquetadas. Las checklists de SEO local y GEO/IA en esa misma página **sí
  son reales** en ambos modos: se calculan a partir del contenido publicado del sitio,
  nunca se marcan como "hecho" sin evidencia.
- Las tarjetas de "Oportunidad SEO" en `/dashboard/opportunities` que hacen referencia a
  una página o búsqueda concreta son **ejemplos ilustrativos, solo en modo demo**
  (llevan la etiqueta "Ejemplo ilustrativo"): requieren analítica por página y Search
  Console, que todavía no existen. El resto de tarjetas de esa página sí se generan con
  datos reales del negocio.
- La atribución de leads (`traffic_source`, `landing_page`...) es honesta con los datos
  que faltan: un lead real sin esos campos se agrupa como "Sin datos de origen" en vez de
  inventarle una fuente.
- No se han añadido "Reservas" ni "Solicitudes de presupuesto" como canales de contacto
  reales porque hoy no existe ninguna integración que genere ese tipo de lead.

## Diseño: tokens de color

`brand` (índigo, primario) y `secondary` (coral, nuevo) son paletas propias definidas en
`tailwind.config.ts`; violeta/azul/turquesa/verde/naranja/rojo usan las paletas por
defecto de Tailwind (`violet`/`sky`/`teal`/`emerald`/`orange`/`red`), sistematizadas en
las tarjetas KPI, las tarjetas de Oportunidades y el acento del sidebar. Los mismos
valores están documentados como variables CSS en `:root` (`src/app/globals.css`:
`--brand-primary`, `--brand-secondary`, `--accent-purple`, `--accent-blue`,
`--accent-cyan`, `--success`, `--warning`, `--danger`).

## Arquitectura del editor (Site / Editable Schema)

`src/lib/site.ts` define el contrato `SiteAdapter` (`getSchema`, `getContent`,
`saveFieldDraft`, `discardDraft`, `publish`, `getChangeLog`) y hoy solo tiene una
implementación real, contra las tablas `site_*` de Supabase — es el adapter nativo de
Línea Sur ("linea-nextjs"). El editor (`EditorShell`) no conoce nada específico de
"Clínica Aurora": renderiza el árbol de páginas/secciones y el formulario de campos a
partir del esquema que le llega, usando un único componente despachador
(`src/components/editor/field-input.tsx`) para los ~16 tipos de campo. Añadir un sitio
nuevo con la misma forma (Hero + Contacto) no requiere tocar código, solo insertar filas
en `site_pages`/`site_sections`/`site_fields` (por SQL, desde `/dashboard/admin/sites`
solo se crea la fila de `sites`).

La edición visual (Prioridad 9 de V0.1) es una versión MVP intencionadamente acotada:
funciona para texto corto, texto largo, CTA y teléfono/WhatsApp del Hero/Contacto (los
tipos que el propio `SitePreview` sabe renderizar); el resto de tipos de campo se sigue
editando desde el formulario lateral. No usa iframe ni `postMessage` — la preview se
renderiza en el mismo árbol de React que el editor, así que seleccionar un campo desde
la preview simplemente resalta y hace scroll hasta su input real; el esquema sigue
siendo la fuente de verdad. La restauración de versiones (Prioridad 10) carga el
`snapshot` de una publicación anterior como **borrador**, nunca sobrescribe lo publicado
directamente: el usuario revisa y decide si publicar.

Preparado pero **no construido a propósito** en esta iteración (queda documentado, no
sobrecargado): edición inline vía iframe + `postMessage` (bridge de seguridad completo),
un importador que detecte automáticamente atributos `data-linea-editable` en una web ya
construida, funciones de IA junto a los campos de texto, adapters para stacks que no
sean el nativo de Línea Sur, y un constructor visual de esquemas para
`/dashboard/admin/sites`.

## Aviso conocido (solo en `next dev`, no en producción)

Durante el desarrollo, en este entorno de pruebas concreto se observó de forma
intermitente un aviso de hidratación de React en `next dev` en varias páginas del
dashboard. `npm run build` siempre compila sin errores ni avisos, y el HTML generado
por el servidor (comprobado con peticiones HTTP directas) es siempre correcto en todas
las páginas nuevas. No se pudo aislar una causa determinista dentro del código de la
aplicación pese a una investigación exhaustiva; todo apunta a una particularidad de
`next dev` en este sandbox concreto más que a un bug de producción. Recomendación:
al desplegar, comprueba con un navegador real que el editor, los formularios y los
menús responden con normalidad (debería ser el caso, como ya ocurría en las páginas
existentes antes de esta iteración).

## Pendiente para una V1

Integración real con Google Search Console (visibilidad, consultas), analítica por
página propia (más allá de la atribución de leads ya implementada), exportación
automática de informes en PDF (hoy es una vista print-friendly manual), edición del
Plan de mejora y respuesta a Solicitudes desde un panel interno de Línea Sur (hoy se
gestionan por SQL), edición inline vía iframe/`postMessage` para sitios que no compartan
árbol de React con el editor, importador automático de esquema, IA junto a los campos de
texto, adapters para otros stacks, constructor visual de esquemas, pipeline visual
(Kanban) de Contactos, multidioma, RBAC con roles más allá de `client`/`admin`/
`linea_staff`, CRM avanzado, automatizaciones, envío de emails, API de WhatsApp,
reservas, facturación/Stripe, PageSpeed, notificaciones y tests exhaustivos quedan fuera
de esta versión a propósito.
