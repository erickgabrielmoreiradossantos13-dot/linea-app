-- Línea App · Rediseño comercial (v0.2)
-- Añade: configuración de valor comercial en businesses, fuente de tráfico
-- "google_maps", y la tabla de Plan de mejora.

-- =========================================================
-- businesses: valor comercial potencial + próxima revisión
-- =========================================================
alter table public.businesses
  add column if not exists avg_client_value numeric(10, 2),
  add column if not exists close_rate numeric(5, 4) not null default 0.30,
  add column if not exists next_review_date date;

drop policy if exists "businesses_update_members" on public.businesses;
create policy "businesses_update_members"
  on public.businesses for update
  to authenticated
  using (public.is_business_member(id))
  with check (public.is_business_member(id));

-- Aunque la policy permite la fila, solo estas columnas son editables por el cliente
-- (el resto, como el nombre o el linea_score, se gestiona desde Línea Sur).
revoke update on public.businesses from authenticated;
grant update (avg_client_value, close_rate) on public.businesses to authenticated;

-- =========================================================
-- analytics_events: nueva fuente de tráfico "google_maps"
-- =========================================================
alter table public.analytics_events drop constraint if exists analytics_events_source_check;
alter table public.analytics_events
  add constraint analytics_events_source_check
  check (source in ('google', 'google_maps', 'instagram', 'facebook', 'directo', 'referido'));

-- =========================================================
-- improvement_plan_items: Plan de mejora (gestionado por Línea Sur)
-- =========================================================
create table if not exists public.improvement_plan_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_progreso', 'completado')),
  position smallint not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists improvement_plan_items_business_id_idx on public.improvement_plan_items(business_id);

alter table public.improvement_plan_items enable row level security;

drop policy if exists "improvement_plan_items_select_members" on public.improvement_plan_items;
create policy "improvement_plan_items_select_members"
  on public.improvement_plan_items for select
  to authenticated
  using (public.is_business_member(business_id));

grant select on public.improvement_plan_items to authenticated;
