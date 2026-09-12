-- Snapshot/hardening derived from production project vozneizszafdokckotwv
-- on 2026-09-12. The initial schema is versioned in 0001_foundation.sql;
-- this migration makes every mutable tenant resource use explicit CRUD policies
-- and adds database-level parent/tenant consistency checks.

begin;

alter table public.support_tickets
  add column if not exists response_note text,
  add column if not exists responded_by uuid references auth.users(id) on delete set null,
  add column if not exists responded_at timestamptz;

create table if not exists public.site_change_log (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists site_change_log_org_time_idx
  on public.site_change_log(organization_id, created_at desc);

-- A child row cannot claim organization A while pointing at a parent in
-- organization B. Existing production data was checked before this migration.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'websites_id_organization_key') then
    alter table public.websites
      add constraint websites_id_organization_key unique (id, organization_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_id_organization_key') then
    alter table public.leads
      add constraint leads_id_organization_key unique (id, organization_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pages_website_organization_fkey') then
    alter table public.pages
      add constraint pages_website_organization_fkey
      foreign key (website_id, organization_id)
      references public.websites(id, organization_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'content_entries_website_organization_fkey') then
    alter table public.content_entries
      add constraint content_entries_website_organization_fkey
      foreign key (website_id, organization_id)
      references public.websites(id, organization_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'lead_notes_lead_organization_fkey') then
    alter table public.lead_notes
      add constraint lead_notes_lead_organization_fkey
      foreign key (lead_id, organization_id)
      references public.leads(id, organization_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_change_log_website_organization_fkey') then
    alter table public.site_change_log
      add constraint site_change_log_website_organization_fkey
      foreign key (website_id, organization_id)
      references public.websites(id, organization_id) on delete cascade;
  end if;
end
$$;

alter table public.site_change_log enable row level security;

-- Leads
drop policy if exists "leads_member_select" on public.leads;
drop policy if exists "leads_admin_write" on public.leads;
drop policy if exists "leads_select_org" on public.leads;
drop policy if exists "leads_insert_org" on public.leads;
drop policy if exists "leads_update_org" on public.leads;
drop policy if exists "leads_delete_org" on public.leads;

create policy "leads_select_org" on public.leads for select to authenticated
  using (public.is_org_member(organization_id));
create policy "leads_insert_org" on public.leads for insert to authenticated
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));
create policy "leads_update_org" on public.leads for update to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));
create policy "leads_delete_org" on public.leads for delete to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));

-- Lead notes
drop policy if exists "lead_notes_member_select" on public.lead_notes;
drop policy if exists "lead_notes_admin_write" on public.lead_notes;
drop policy if exists "lead_notes_select_org" on public.lead_notes;
drop policy if exists "lead_notes_insert_org" on public.lead_notes;
drop policy if exists "lead_notes_update_org" on public.lead_notes;
drop policy if exists "lead_notes_delete_org" on public.lead_notes;

create policy "lead_notes_select_org" on public.lead_notes for select to authenticated
  using (public.is_org_member(organization_id));
create policy "lead_notes_insert_org" on public.lead_notes for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[])
  );
create policy "lead_notes_update_org" on public.lead_notes for update to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));
create policy "lead_notes_delete_org" on public.lead_notes for delete to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));

-- Websites
drop policy if exists "websites_member_select" on public.websites;
drop policy if exists "websites_admin_write" on public.websites;
drop policy if exists "websites_select_org" on public.websites;
drop policy if exists "websites_insert_org" on public.websites;
drop policy if exists "websites_update_org" on public.websites;
drop policy if exists "websites_delete_org" on public.websites;

create policy "websites_select_org" on public.websites for select to authenticated
  using (public.is_org_member(organization_id));
create policy "websites_insert_org" on public.websites for insert to authenticated
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));
create policy "websites_update_org" on public.websites for update to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));
create policy "websites_delete_org" on public.websites for delete to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));

-- Pages
drop policy if exists "pages_member_select" on public.pages;
drop policy if exists "pages_editor_write" on public.pages;
drop policy if exists "pages_select_org" on public.pages;
drop policy if exists "pages_insert_org" on public.pages;
drop policy if exists "pages_update_org" on public.pages;
drop policy if exists "pages_delete_org" on public.pages;

create policy "pages_select_org" on public.pages for select to authenticated
  using (public.is_org_member(organization_id));
create policy "pages_insert_org" on public.pages for insert to authenticated
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));
create policy "pages_update_org" on public.pages for update to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));
create policy "pages_delete_org" on public.pages for delete to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));

-- Content entries
drop policy if exists "content_member_select" on public.content_entries;
drop policy if exists "content_editor_write" on public.content_entries;
drop policy if exists "content_entries_select_org" on public.content_entries;
drop policy if exists "content_entries_insert_org" on public.content_entries;
drop policy if exists "content_entries_update_org" on public.content_entries;
drop policy if exists "content_entries_delete_org" on public.content_entries;

create policy "content_entries_select_org" on public.content_entries for select to authenticated
  using (public.is_org_member(organization_id));
create policy "content_entries_insert_org" on public.content_entries for insert to authenticated
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));
create policy "content_entries_update_org" on public.content_entries for update to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));
create policy "content_entries_delete_org" on public.content_entries for delete to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));

-- Support tickets: customers can create and read their own organization's
-- tickets. Only Línea Sur super admins can change or delete workflow records.
drop policy if exists "tickets_member_select" on public.support_tickets;
drop policy if exists "tickets_member_insert" on public.support_tickets;
drop policy if exists "tickets_admin_update" on public.support_tickets;
drop policy if exists "support_tickets_select_org" on public.support_tickets;
drop policy if exists "support_tickets_insert_org" on public.support_tickets;
drop policy if exists "support_tickets_update_org" on public.support_tickets;
drop policy if exists "support_tickets_delete_org" on public.support_tickets;

create policy "support_tickets_select_org" on public.support_tickets for select to authenticated
  using (public.is_org_member(organization_id));
create policy "support_tickets_insert_org" on public.support_tickets for insert to authenticated
  with check (public.is_org_member(organization_id) and created_by = auth.uid());
create policy "support_tickets_update_org" on public.support_tickets for update to authenticated
  using (public.is_super_admin() and public.is_org_member(organization_id))
  with check (public.is_super_admin() and public.is_org_member(organization_id));
create policy "support_tickets_delete_org" on public.support_tickets for delete to authenticated
  using (public.is_super_admin() and public.is_org_member(organization_id));

-- Site change log
drop policy if exists "site_change_log_select_org" on public.site_change_log;
drop policy if exists "site_change_log_insert_org" on public.site_change_log;
drop policy if exists "site_change_log_update_org" on public.site_change_log;
drop policy if exists "site_change_log_delete_org" on public.site_change_log;

create policy "site_change_log_select_org" on public.site_change_log for select to authenticated
  using (public.is_org_member(organization_id));
create policy "site_change_log_insert_org" on public.site_change_log for insert to authenticated
  with check (
    actor_user_id = auth.uid()
    and public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[])
  );
create policy "site_change_log_update_org" on public.site_change_log for update to authenticated
  using (public.is_super_admin() and public.is_org_member(organization_id))
  with check (public.is_super_admin() and public.is_org_member(organization_id));
create policy "site_change_log_delete_org" on public.site_change_log for delete to authenticated
  using (public.is_super_admin() and public.is_org_member(organization_id));

-- Integrations
drop policy if exists "integrations_member_select" on public.integrations;
drop policy if exists "integrations_owner_write" on public.integrations;
drop policy if exists "integrations_select_org" on public.integrations;
drop policy if exists "integrations_insert_org" on public.integrations;
drop policy if exists "integrations_update_org" on public.integrations;
drop policy if exists "integrations_delete_org" on public.integrations;

create policy "integrations_select_org" on public.integrations for select to authenticated
  using (public.is_org_member(organization_id));
create policy "integrations_insert_org" on public.integrations for insert to authenticated
  with check (public.has_org_role(organization_id, array['OWNER']::public.organization_role[]));
create policy "integrations_update_org" on public.integrations for update to authenticated
  using (public.has_org_role(organization_id, array['OWNER']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER']::public.organization_role[]));
create policy "integrations_delete_org" on public.integrations for delete to authenticated
  using (public.has_org_role(organization_id, array['OWNER']::public.organization_role[]));

commit;
