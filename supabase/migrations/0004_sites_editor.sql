-- Línea App · Site / Editable Schema / Editor por secciones (v0.3)
-- Arquitectura genérica: Línea Sur define qué es editable (schema), el
-- cliente edita solo el contenido permitido, con borrador/publicación e
-- historial. Un único adapter nativo (src/lib/site.ts) implementa esto hoy;
-- el modelo está pensado para poder añadir otros adapters más adelante.

-- =========================================================
-- linea_staff: equipo interno de Línea Sur (acceso cruzado a todos los negocios)
-- =========================================================
create table if not exists public.linea_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_linea_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.linea_staff where user_id = auth.uid()
  );
$$;

grant execute on function public.is_linea_staff() to authenticated;

-- El equipo de Línea Sur también necesita poder listar los negocios (para
-- asignarles un sitio desde /dashboard/admin/sites).
drop policy if exists "businesses_select_members" on public.businesses;
create policy "businesses_select_members" on public.businesses for select to authenticated
  using (public.is_business_member(id) or public.is_linea_staff());

-- =========================================================
-- sites: un negocio puede tener uno o varios sitios
-- =========================================================
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  domain text,
  preview_url text,
  production_url text,
  framework text not null default 'linea-nextjs',
  status text not null default 'draft' check (status in ('draft', 'published')),
  last_published_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists sites_business_id_idx on public.sites(business_id);

-- =========================================================
-- site_pages / site_sections / site_fields: el Editable Schema
-- =========================================================
create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  slug text not null,
  name text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (site_id, slug)
);

create table if not exists public.site_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.site_pages(id) on delete cascade,
  key text not null,
  name text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (page_id, key)
);

-- field_type cubre: text, textarea, rich_text, number, price, image, gallery,
-- url, email, phone, color, select, boolean, date, opening_hours, location,
-- collection. Los límites de una colección (maxItems/canCreate/canDelete/
-- canReorder) y el mini-esquema de sus items (itemFields) viven en `config`.
create table if not exists public.site_fields (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.site_sections(id) on delete cascade,
  key text not null,
  label text not null,
  field_type text not null check (field_type in (
    'text', 'textarea', 'rich_text', 'number', 'price', 'image', 'gallery',
    'url', 'email', 'phone', 'color', 'select', 'boolean', 'date',
    'opening_hours', 'location', 'collection'
  )),
  position smallint not null default 0,
  config jsonb not null default '{}',
  editable_by_client boolean not null default true,
  created_at timestamptz not null default now(),
  unique (section_id, key)
);

-- =========================================================
-- site_field_values: contenido (borrador + publicado) de un campo simple
-- =========================================================
create table if not exists public.site_field_values (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null unique references public.site_fields(id) on delete cascade,
  draft_value jsonb,
  published_value jsonb,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

-- =========================================================
-- site_collection_items: contenido (borrador + publicado) de un campo de tipo collection
-- =========================================================
create table if not exists public.site_collection_items (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.site_fields(id) on delete cascade,
  position smallint not null default 0,
  draft_data jsonb not null default '{}',
  published_data jsonb,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_collection_items_field_id_idx on public.site_collection_items(field_id);

-- =========================================================
-- site_change_log: historial de cambios (base para versionado futuro)
-- =========================================================
create table if not exists public.site_change_log (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  actor_email text,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists site_change_log_site_id_idx on public.site_change_log(site_id);

-- =========================================================
-- media_assets: biblioteca de imágenes básica
-- =========================================================
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  storage_path text not null,
  url text not null,
  filename text not null,
  mime_type text not null,
  width int,
  height int,
  size_bytes int,
  created_at timestamptz not null default now()
);

create index if not exists media_assets_business_id_idx on public.media_assets(business_id);

-- =========================================================
-- Funciones auxiliares para RLS (evitan repetir el join en cada policy)
-- =========================================================
create or replace function public.site_business_id(target_site_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select business_id from public.sites where id = target_site_id;
$$;

create or replace function public.can_access_site(target_site_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_business_member(public.site_business_id(target_site_id)) or public.is_linea_staff();
$$;

create or replace function public.field_site_id(target_field_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select sp.site_id
  from public.site_fields sf
  join public.site_sections ss on ss.id = sf.section_id
  join public.site_pages sp on sp.id = ss.page_id
  where sf.id = target_field_id;
$$;

create or replace function public.field_is_client_editable(target_field_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(editable_by_client, false) from public.site_fields where id = target_field_id;
$$;

grant execute on function public.site_business_id(uuid) to authenticated;
grant execute on function public.can_access_site(uuid) to authenticated;
grant execute on function public.field_site_id(uuid) to authenticated;
grant execute on function public.field_is_client_editable(uuid) to authenticated;

-- =========================================================
-- RLS
-- =========================================================
alter table public.sites enable row level security;
alter table public.site_pages enable row level security;
alter table public.site_sections enable row level security;
alter table public.site_fields enable row level security;
alter table public.site_field_values enable row level security;
alter table public.site_collection_items enable row level security;
alter table public.site_change_log enable row level security;
alter table public.media_assets enable row level security;

-- Lectura del árbol completo del sitio: miembros del negocio o staff de Línea Sur
drop policy if exists "sites_select" on public.sites;
create policy "sites_select" on public.sites for select to authenticated
  using (public.is_business_member(business_id) or public.is_linea_staff());

drop policy if exists "site_pages_select" on public.site_pages;
create policy "site_pages_select" on public.site_pages for select to authenticated
  using (public.can_access_site(site_id));

drop policy if exists "site_sections_select" on public.site_sections;
create policy "site_sections_select" on public.site_sections for select to authenticated
  using (public.can_access_site((select site_id from public.site_pages where id = page_id)));

drop policy if exists "site_fields_select" on public.site_fields;
create policy "site_fields_select" on public.site_fields for select to authenticated
  using (public.can_access_site(public.field_site_id(id)));

drop policy if exists "site_change_log_select" on public.site_change_log;
create policy "site_change_log_select" on public.site_change_log for select to authenticated
  using (public.can_access_site(site_id));

-- Escritura de la ESTRUCTURA (qué existe y qué es editable): solo Línea Sur
drop policy if exists "sites_write_staff" on public.sites;
create policy "sites_write_staff" on public.sites for all to authenticated
  using (public.is_linea_staff()) with check (public.is_linea_staff());

drop policy if exists "site_pages_write_staff" on public.site_pages;
create policy "site_pages_write_staff" on public.site_pages for all to authenticated
  using (public.is_linea_staff()) with check (public.is_linea_staff());

drop policy if exists "site_sections_write_staff" on public.site_sections;
create policy "site_sections_write_staff" on public.site_sections for all to authenticated
  using (public.is_linea_staff()) with check (public.is_linea_staff());

drop policy if exists "site_fields_write_staff" on public.site_fields;
create policy "site_fields_write_staff" on public.site_fields for all to authenticated
  using (public.is_linea_staff()) with check (public.is_linea_staff());

-- Lectura y escritura del CONTENIDO: miembros del negocio solo si el campo es
-- editable_by_client; staff de Línea Sur siempre.
drop policy if exists "site_field_values_select" on public.site_field_values;
create policy "site_field_values_select" on public.site_field_values for select to authenticated
  using (public.can_access_site(public.field_site_id(field_id)));

drop policy if exists "site_field_values_write" on public.site_field_values;
create policy "site_field_values_write" on public.site_field_values for all to authenticated
  using (
    public.is_linea_staff()
    or (public.field_is_client_editable(field_id) and public.is_business_member(public.site_business_id(public.field_site_id(field_id))))
  )
  with check (
    public.is_linea_staff()
    or (public.field_is_client_editable(field_id) and public.is_business_member(public.site_business_id(public.field_site_id(field_id))))
  );

drop policy if exists "site_collection_items_select" on public.site_collection_items;
create policy "site_collection_items_select" on public.site_collection_items for select to authenticated
  using (public.can_access_site(public.field_site_id(field_id)));

drop policy if exists "site_collection_items_write" on public.site_collection_items;
create policy "site_collection_items_write" on public.site_collection_items for all to authenticated
  using (
    public.is_linea_staff()
    or (public.field_is_client_editable(field_id) and public.is_business_member(public.site_business_id(public.field_site_id(field_id))))
  )
  with check (
    public.is_linea_staff()
    or (public.field_is_client_editable(field_id) and public.is_business_member(public.site_business_id(public.field_site_id(field_id))))
  );

-- El historial lo puede escribir cualquiera con acceso al sitio (queda registro de quién hizo qué)
drop policy if exists "site_change_log_insert" on public.site_change_log;
create policy "site_change_log_insert" on public.site_change_log for insert to authenticated
  with check (public.can_access_site(site_id));

-- media_assets: cada negocio ve/gestiona lo suyo; staff ve/gestiona todo
drop policy if exists "media_assets_select" on public.media_assets;
create policy "media_assets_select" on public.media_assets for select to authenticated
  using (public.is_business_member(business_id) or public.is_linea_staff());

drop policy if exists "media_assets_write" on public.media_assets;
create policy "media_assets_write" on public.media_assets for all to authenticated
  using (public.is_business_member(business_id) or public.is_linea_staff())
  with check (public.is_business_member(business_id) or public.is_linea_staff());

grant select on public.sites, public.site_pages, public.site_sections, public.site_fields,
  public.site_field_values, public.site_collection_items, public.site_change_log, public.media_assets
  to authenticated;
grant insert, update, delete on public.sites, public.site_pages, public.site_sections, public.site_fields
  to authenticated;
grant insert, update on public.site_field_values, public.site_collection_items to authenticated;
grant insert on public.site_change_log to authenticated;
grant insert, update, delete on public.media_assets to authenticated;

-- =========================================================
-- Storage: bucket "site-media" para la biblioteca de imágenes.
-- Convención de ruta: {business_id}/{archivo} — así la policy puede
-- comprobar pertenencia sin tabla adicional.
-- =========================================================
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

drop policy if exists "site_media_select" on storage.objects;
create policy "site_media_select" on storage.objects for select to authenticated
  using (bucket_id = 'site-media');

drop policy if exists "site_media_insert" on storage.objects;
create policy "site_media_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'site-media'
    and (
      public.is_linea_staff()
      or public.is_business_member(((storage.foldername(name))[1])::uuid)
    )
  );

drop policy if exists "site_media_delete" on storage.objects;
create policy "site_media_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'site-media'
    and (
      public.is_linea_staff()
      or public.is_business_member(((storage.foldername(name))[1])::uuid)
    )
  );
