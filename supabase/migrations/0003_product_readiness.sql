-- Product-readiness additions discovered after the production RLS audit.

begin;

create table if not exists public.seo_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  check_key text not null,
  completed boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, check_key)
);

create index if not exists seo_checks_org_idx on public.seo_checks(organization_id);
alter table public.seo_checks enable row level security;

drop policy if exists "seo_checks_select_org" on public.seo_checks;
drop policy if exists "seo_checks_insert_org" on public.seo_checks;
drop policy if exists "seo_checks_update_org" on public.seo_checks;
drop policy if exists "seo_checks_delete_org" on public.seo_checks;

create policy "seo_checks_select_org" on public.seo_checks for select to authenticated
  using (public.is_org_member(organization_id));
create policy "seo_checks_insert_org" on public.seo_checks for insert to authenticated
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));
create policy "seo_checks_update_org" on public.seo_checks for update to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));
create policy "seo_checks_delete_org" on public.seo_checks for delete to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));

-- Replace the broad media write policy with explicit operations.
drop policy if exists "media_editor_write" on public.media;
drop policy if exists "media_member_select" on public.media;
drop policy if exists "media_select_org" on public.media;
drop policy if exists "media_insert_org" on public.media;
drop policy if exists "media_update_org" on public.media;
drop policy if exists "media_delete_org" on public.media;

create policy "media_select_org" on public.media for select to authenticated
  using (public.is_org_member(organization_id));
create policy "media_insert_org" on public.media for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[])
  );
create policy "media_update_org" on public.media for update to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));
create policy "media_delete_org" on public.media for delete to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));

grant select, insert, update, delete on public.site_change_log to authenticated;
grant usage, select on sequence public.site_change_log_id_seq to authenticated;
grant select, insert, update, delete on public.seo_checks to authenticated;

commit;
