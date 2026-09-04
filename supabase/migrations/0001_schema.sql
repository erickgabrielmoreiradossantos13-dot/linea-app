-- Línea App · esquema base (v0)
-- Tablas: businesses, business_members, leads, website_content, analytics_events

create extension if not exists pgcrypto;

-- =========================================================
-- businesses
-- =========================================================
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  slug text not null unique,
  linea_score smallint not null default 0 check (linea_score between 0 and 100),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- =========================================================
-- business_members (vincula usuarios de auth.users a un business)
-- =========================================================
create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists business_members_user_id_idx on public.business_members(user_id);
create index if not exists business_members_business_id_idx on public.business_members(business_id);

-- =========================================================
-- leads
-- =========================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  service text,
  source text not null check (source in ('whatsapp', 'formulario', 'llamada')),
  status text not null default 'nuevo' check (status in ('nuevo', 'contactado', 'cita', 'ganado', 'perdido')),
  value_estimate numeric(10, 2) not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists leads_business_id_idx on public.leads(business_id);
create index if not exists leads_created_at_idx on public.leads(created_at);
create index if not exists leads_status_idx on public.leads(status);

-- =========================================================
-- website_content (una fila por business: borrador + última publicación)
-- =========================================================
create table if not exists public.website_content (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  headline text not null default '',
  description text not null default '',
  cta_text text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  published_headline text,
  published_description text,
  published_cta_text text,
  published_phone text,
  published_whatsapp text,
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

-- =========================================================
-- analytics_events (visitas de la web del negocio)
-- =========================================================
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_type text not null default 'visit' check (event_type in ('visit')),
  source text not null check (source in ('google', 'instagram', 'facebook', 'directo', 'referido')),
  occurred_at timestamptz not null default now(),
  is_demo boolean not null default false
);

create index if not exists analytics_events_business_id_idx on public.analytics_events(business_id);
create index if not exists analytics_events_occurred_at_idx on public.analytics_events(occurred_at);
