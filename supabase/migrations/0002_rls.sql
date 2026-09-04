-- Línea App · Row Level Security (v0)
-- Multi-tenant simple: cada usuario ve solo los datos de su(s) business(es).

-- =========================================================
-- Función auxiliar (security definer para evitar recursión de RLS
-- al consultar business_members desde las políticas de otras tablas)
-- =========================================================
create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = target_business_id
      and user_id = auth.uid()
  );
$$;

grant execute on function public.is_business_member(uuid) to authenticated;

-- =========================================================
-- Activar RLS
-- =========================================================
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.leads enable row level security;
alter table public.website_content enable row level security;
alter table public.analytics_events enable row level security;

-- =========================================================
-- businesses: un miembro puede ver su propio negocio
-- =========================================================
drop policy if exists "businesses_select_members" on public.businesses;
create policy "businesses_select_members"
  on public.businesses for select
  to authenticated
  using (public.is_business_member(id));

-- =========================================================
-- business_members: un usuario ve únicamente sus propias filas de membresía
-- =========================================================
drop policy if exists "business_members_select_own" on public.business_members;
create policy "business_members_select_own"
  on public.business_members for select
  to authenticated
  using (user_id = auth.uid());

-- =========================================================
-- leads: lectura y actualización de estado solo para miembros del negocio
-- =========================================================
drop policy if exists "leads_select_members" on public.leads;
create policy "leads_select_members"
  on public.leads for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "leads_update_members" on public.leads;
create policy "leads_update_members"
  on public.leads for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- =========================================================
-- website_content: lectura y edición (borrador/publicación) para miembros
-- =========================================================
drop policy if exists "website_content_select_members" on public.website_content;
create policy "website_content_select_members"
  on public.website_content for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "website_content_update_members" on public.website_content;
create policy "website_content_update_members"
  on public.website_content for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- =========================================================
-- analytics_events: solo lectura para miembros del negocio
-- =========================================================
drop policy if exists "analytics_events_select_members" on public.analytics_events;
create policy "analytics_events_select_members"
  on public.analytics_events for select
  to authenticated
  using (public.is_business_member(business_id));

-- =========================================================
-- Grants de tabla (RLS sigue controlando el acceso fila a fila)
-- =========================================================
grant usage on schema public to authenticated;
grant select on public.businesses to authenticated;
grant select on public.business_members to authenticated;
grant select, update on public.leads to authenticated;
grant select, update on public.website_content to authenticated;
grant select on public.analytics_events to authenticated;
