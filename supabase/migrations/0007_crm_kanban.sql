-- Línea App · CRM operativo (Fase CRM): pipeline "Negociación" en vez de "Cita"
-- Aditivo/no destructivo: los leads existentes con status = 'cita' pasan a
-- 'negociacion' automáticamente, sin perder ningún dato.

update public.leads set status = 'negociacion' where status = 'cita';

alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check
  check (status in ('nuevo', 'contactado', 'negociacion', 'ganado', 'perdido'));

-- "manual": contactos añadidos a mano desde el CRM (no vienen de un canal de conversión real).
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check
  check (source in ('whatsapp', 'formulario', 'llamada', 'manual'));

-- Hasta ahora los leads solo se creaban vía ingesta con service_role (que
-- omite RLS); no existía política de INSERT para usuarios autenticados.
-- El CRM permite ahora añadir contactos a mano, así que un miembro del
-- negocio (o staff) puede crear leads para SU PROPIO negocio.
drop policy if exists "leads_insert_members" on public.leads;
create policy "leads_insert_members"
  on public.leads for insert
  to authenticated
  with check (public.is_business_member(business_id) or public.is_linea_staff());

grant insert on public.leads to authenticated;

-- El staff de Línea Sur puede entrar como un cliente ("Proyectos") para
-- gestionar su CRM en su nombre: las policies de leads (y sus notas) deben
-- permitir también is_linea_staff(), no solo is_business_member().
drop policy if exists "leads_select_members" on public.leads;
create policy "leads_select_members"
  on public.leads for select
  to authenticated
  using (public.is_business_member(business_id) or public.is_linea_staff());

drop policy if exists "leads_update_members" on public.leads;
create policy "leads_update_members"
  on public.leads for update
  to authenticated
  using (public.is_business_member(business_id) or public.is_linea_staff())
  with check (public.is_business_member(business_id) or public.is_linea_staff());

drop policy if exists "lead_notes_select_members" on public.lead_notes;
create policy "lead_notes_select_members"
  on public.lead_notes for select
  to authenticated
  using (public.is_business_member(business_id) or public.is_linea_staff());

drop policy if exists "lead_notes_insert_members" on public.lead_notes;
create policy "lead_notes_insert_members"
  on public.lead_notes for insert
  to authenticated
  with check (public.is_business_member(business_id) or public.is_linea_staff());

drop policy if exists "improvement_plan_items_select_members" on public.improvement_plan_items;
create policy "improvement_plan_items_select_members"
  on public.improvement_plan_items for select
  to authenticated
  using (public.is_business_member(business_id) or public.is_linea_staff());

drop policy if exists "analytics_events_select_members" on public.analytics_events;
create policy "analytics_events_select_members"
  on public.analytics_events for select
  to authenticated
  using (public.is_business_member(business_id) or public.is_linea_staff());
