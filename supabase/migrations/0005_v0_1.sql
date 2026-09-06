-- Línea App · V0 → V0.1: plan de mejora enriquecido, solicitudes/soporte,
-- atribución básica de leads y snapshot de publicación (para restaurar).
-- Todo aditivo: ninguna tabla ni columna existente se elimina.

-- =========================================================
-- improvement_plan_items: categoría, prioridad, impacto, resultado
-- =========================================================
alter table public.improvement_plan_items
  add column if not exists category text,
  add column if not exists priority text not null default 'media',
  add column if not exists description text,
  add column if not exists impact text,
  add column if not exists target_date date,
  add column if not exists result text;

alter table public.improvement_plan_items
  add constraint improvement_plan_items_category_check
  check (category is null or category in (
    'conversion', 'contenido', 'seo_local', 'geo_ia', 'google', 'rendimiento', 'diseno_ux', 'tecnico'
  ));

alter table public.improvement_plan_items
  add constraint improvement_plan_items_priority_check
  check (priority in ('alta', 'media', 'baja'));

-- Amplía los estados existentes (pendiente/en_progreso/completado) con los
-- del nuevo flujo comercial, sin perder filas ya creadas con los antiguos.
update public.improvement_plan_items set status = 'recomendado' where status = 'pendiente';

alter table public.improvement_plan_items drop constraint if exists improvement_plan_items_status_check;
alter table public.improvement_plan_items
  add constraint improvement_plan_items_status_check
  check (status in ('recomendado', 'planificado', 'en_progreso', 'completado', 'descartado'));

alter table public.improvement_plan_items alter column status set default 'recomendado';

-- =========================================================
-- leads: atribución básica (de dónde vino cada oportunidad)
-- `source` ya existe y funciona como "conversion_type" (whatsapp/formulario/
-- llamada); estas columnas son el origen de marketing, no lo sustituyen.
-- =========================================================
alter table public.leads
  add column if not exists traffic_source text,
  add column if not exists traffic_medium text,
  add column if not exists campaign text,
  add column if not exists landing_page text,
  add column if not exists referrer text;

create index if not exists leads_traffic_source_idx on public.leads(traffic_source);
create index if not exists leads_landing_page_idx on public.leads(landing_page);

-- =========================================================
-- site_change_log: snapshot del contenido publicado, base de "Restaurar"
-- =========================================================
alter table public.site_change_log
  add column if not exists snapshot jsonb;

-- =========================================================
-- support_requests: solicitudes del cliente a Línea Sur
-- =========================================================
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null,
  category text not null check (category in (
    'cambio_contenido', 'nueva_seccion', 'problema_tecnico', 'seo_google', 'nueva_funcionalidad', 'otro'
  )),
  priority text not null default 'media' check (priority in ('alta', 'media', 'baja')),
  status text not null default 'recibida' check (status in ('recibida', 'revisando', 'en_progreso', 'resuelta')),
  response_notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_business_id_idx on public.support_requests(business_id, created_at desc);

drop trigger if exists set_updated_at on public.support_requests;
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger set_updated_at before update on public.support_requests
  for each row execute function public.set_updated_at();

alter table public.support_requests enable row level security;

-- El cliente ve y crea sus propias solicitudes; Línea Sur ve/gestiona todas.
drop policy if exists "support_requests_select" on public.support_requests;
create policy "support_requests_select" on public.support_requests for select to authenticated
  using (public.is_business_member(business_id) or public.is_linea_staff());

drop policy if exists "support_requests_insert" on public.support_requests;
create policy "support_requests_insert" on public.support_requests for insert to authenticated
  with check (public.is_business_member(business_id) or public.is_linea_staff());

-- El estado y las notas de respuesta las gestiona Línea Sur; el cliente no
-- edita su propia solicitud una vez enviada (evita pseudo-tickets fantasma).
drop policy if exists "support_requests_update_staff" on public.support_requests;
create policy "support_requests_update_staff" on public.support_requests for update to authenticated
  using (public.is_linea_staff())
  with check (public.is_linea_staff());

grant select, insert on public.support_requests to authenticated;
grant update on public.support_requests to authenticated;
