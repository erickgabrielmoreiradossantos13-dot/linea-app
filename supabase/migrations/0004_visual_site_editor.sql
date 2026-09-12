-- Visual editor: isolated drafts, ordered blocks, restorable versions and scheduling.

begin;

alter table public.websites
  add column if not exists publish_at timestamptz;

alter table public.pages
  add column if not exists draft_title text,
  add column if not exists draft_meta_description text,
  add column if not exists draft_is_indexable boolean,
  add column if not exists has_unpublished_changes boolean not null default false,
  add column if not exists published_at timestamptz;

update public.pages
set draft_title = coalesce(draft_title, title),
    draft_meta_description = coalesce(draft_meta_description, meta_description),
    draft_is_indexable = coalesce(draft_is_indexable, is_indexable)
where draft_title is null or draft_is_indexable is null;

alter table public.pages
  alter column draft_title set not null,
  alter column draft_is_indexable set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pages_id_org_website_key') then
    alter table public.pages
      add constraint pages_id_org_website_key unique (id, organization_id, website_id);
  end if;
end
$$;

create table if not exists public.page_blocks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  page_id uuid not null references public.pages(id) on delete cascade,
  type text not null check (type in ('text','image_text','cards','cta')),
  position integer not null default 0 check (position >= 0),
  config jsonb not null default '{}'::jsonb,
  draft_config jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  draft_visible boolean not null default true,
  has_unpublished_changes boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id, website_id, page_id),
  constraint page_blocks_page_org_website_fkey
    foreign key (page_id, organization_id, website_id)
    references public.pages(id, organization_id, website_id) on delete cascade
);

create index if not exists page_blocks_page_position_idx
  on public.page_blocks(organization_id, website_id, page_id, position);

alter table public.content_entries
  add column if not exists page_id uuid,
  add column if not exists block_id uuid,
  add column if not exists draft_value jsonb,
  add column if not exists has_unpublished_changes boolean not null default false,
  add column if not exists published_at timestamptz;

update public.content_entries
set draft_value = value
where draft_value is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'content_entries_page_org_website_fkey') then
    alter table public.content_entries
      add constraint content_entries_page_org_website_fkey
      foreign key (page_id, organization_id, website_id)
      references public.pages(id, organization_id, website_id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'content_entries_block_org_website_page_fkey') then
    alter table public.content_entries
      add constraint content_entries_block_org_website_page_fkey
      foreign key (block_id, organization_id, website_id, page_id)
      references public.page_blocks(id, organization_id, website_id, page_id) on delete cascade;
  end if;
end
$$;

create index if not exists content_entries_page_block_idx
  on public.content_entries(organization_id, website_id, page_id, block_id);

create table if not exists public.site_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  label text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  constraint site_versions_website_org_fkey
    foreign key (website_id, organization_id)
    references public.websites(id, organization_id) on delete cascade
);

create index if not exists site_versions_website_time_idx
  on public.site_versions(organization_id, website_id, created_at desc);

alter table public.page_blocks enable row level security;
alter table public.site_versions enable row level security;

create policy "page_blocks_select_org" on public.page_blocks for select to authenticated
  using (public.is_org_member(organization_id));
create policy "page_blocks_insert_org" on public.page_blocks for insert to authenticated
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));
create policy "page_blocks_update_org" on public.page_blocks for update to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));
create policy "page_blocks_delete_org" on public.page_blocks for delete to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));

create policy "site_versions_select_org" on public.site_versions for select to authenticated
  using (public.is_org_member(organization_id));
create policy "site_versions_insert_admin" on public.site_versions for insert to authenticated
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));
create policy "site_versions_update_super_admin" on public.site_versions for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
create policy "site_versions_delete_super_admin" on public.site_versions for delete to authenticated
  using (public.is_super_admin());

grant select, insert, update, delete on public.page_blocks to authenticated;
grant select, insert, update, delete on public.site_versions to authenticated;

create or replace function public.enforce_visual_editor_publish_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org uuid := coalesce(new.organization_id, old.organization_id);
begin
  if auth.role() = 'service_role' then return new; end if;

  if tg_table_name = 'page_blocks' and (
    new.config is distinct from old.config or
    new.is_published is distinct from old.is_published or
    new.published_at is distinct from old.published_at
  ) and not public.has_org_role(target_org, array['OWNER','ADMIN']::public.organization_role[]) then
    raise exception 'publish_requires_admin';
  end if;

  if tg_table_name = 'content_entries' and (
    new.value is distinct from old.value or
    new.published_at is distinct from old.published_at
  ) and not public.has_org_role(target_org, array['OWNER','ADMIN']::public.organization_role[]) then
    raise exception 'publish_requires_admin';
  end if;

  if tg_table_name = 'pages' and (
    new.title is distinct from old.title or
    new.meta_description is distinct from old.meta_description or
    new.is_indexable is distinct from old.is_indexable or
    new.published_at is distinct from old.published_at
  ) and not public.has_org_role(target_org, array['OWNER','ADMIN']::public.organization_role[]) then
    raise exception 'publish_requires_admin';
  end if;

  return new;
end;
$$;

drop trigger if exists page_blocks_publish_guard on public.page_blocks;
create trigger page_blocks_publish_guard before update on public.page_blocks
for each row execute function public.enforce_visual_editor_publish_role();
drop trigger if exists content_entries_publish_guard on public.content_entries;
create trigger content_entries_publish_guard before update on public.content_entries
for each row execute function public.enforce_visual_editor_publish_role();
drop trigger if exists pages_publish_guard on public.pages;
create trigger pages_publish_guard before update on public.pages
for each row execute function public.enforce_visual_editor_publish_role();

create or replace function public.publish_website_draft(target_website uuid, scheduled_run boolean default false)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org uuid;
  version_id uuid;
  published_snapshot jsonb;
  actor_id uuid := auth.uid();
  now_at timestamptz := now();
begin
  select organization_id into target_org
  from public.websites
  where id = target_website and status = 'ACTIVE';

  if target_org is null then raise exception 'website_not_found'; end if;
  if auth.role() <> 'service_role'
     and not public.has_org_role(target_org, array['OWNER','ADMIN']::public.organization_role[]) then
    raise exception 'publish_requires_admin';
  end if;

  published_snapshot := jsonb_build_object(
    'websiteId', target_website,
    'pages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'title', p.draft_title,
        'metaDescription', p.draft_meta_description,
        'isIndexable', p.draft_is_indexable
      ) order by p.path)
      from public.pages p where p.website_id = target_website and p.organization_id = target_org
    ), '[]'::jsonb),
    'blocks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id, 'pageId', b.page_id, 'type', b.type,
        'position', b.position, 'config', b.draft_config
      ) order by b.page_id, b.position)
      from public.page_blocks b
      where b.website_id = target_website and b.organization_id = target_org and b.draft_visible
    ), '[]'::jsonb),
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'value', c.draft_value))
      from public.content_entries c
      join public.page_blocks b on b.id = c.block_id and b.organization_id = c.organization_id
      where c.website_id = target_website and c.organization_id = target_org and b.draft_visible
    ), '[]'::jsonb)
  );

  insert into public.site_versions (organization_id, website_id, actor_user_id, label, snapshot)
  values (
    target_org, target_website, actor_id,
    case when scheduled_run then 'Publicación programada' else 'Publicación manual' end,
    published_snapshot
  ) returning id into version_id;

  update public.pages set
    title = draft_title,
    meta_description = draft_meta_description,
    is_indexable = draft_is_indexable,
    has_unpublished_changes = false,
    published_at = now_at,
    updated_at = now_at
  where website_id = target_website and organization_id = target_org;

  update public.page_blocks set
    config = draft_config,
    is_published = draft_visible,
    has_unpublished_changes = false,
    published_at = now_at,
    updated_at = now_at
  where website_id = target_website and organization_id = target_org;

  update public.content_entries set
    value = draft_value,
    has_unpublished_changes = false,
    published_at = now_at,
    updated_at = now_at
  where website_id = target_website and organization_id = target_org;

  update public.websites set published_at = now_at, publish_at = null, updated_at = now_at
  where id = target_website and organization_id = target_org;

  insert into public.site_change_log
    (organization_id, website_id, actor_user_id, action, target_type, target_id, changes)
  values (
    target_org, target_website, actor_id,
    case when scheduled_run then 'site.published_scheduled' else 'site.published' end,
    'website', target_website::text, jsonb_build_object('version_id', version_id)
  );

  return version_id;
end;
$$;

create or replace function public.restore_website_version(target_website uuid, target_version uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org uuid;
  version_snapshot jsonb;
  item jsonb;
begin
  select organization_id into target_org from public.websites where id = target_website;
  if target_org is null then raise exception 'website_not_found'; end if;
  if not public.has_org_role(target_org, array['OWNER','ADMIN','EDITOR']::public.organization_role[]) then
    raise exception 'edit_requires_editor';
  end if;

  select snapshot into version_snapshot from public.site_versions
  where id = target_version and website_id = target_website and organization_id = target_org;
  if version_snapshot is null then raise exception 'version_not_found'; end if;

  update public.page_blocks set draft_visible = false, has_unpublished_changes = true, updated_at = now()
  where website_id = target_website and organization_id = target_org;

  for item in select * from jsonb_array_elements(version_snapshot->'pages') loop
    update public.pages set
      draft_title = item->>'title',
      draft_meta_description = item->>'metaDescription',
      draft_is_indexable = coalesce((item->>'isIndexable')::boolean, true),
      has_unpublished_changes = true,
      updated_at = now()
    where id = (item->>'id')::uuid and website_id = target_website and organization_id = target_org;
  end loop;

  for item in select * from jsonb_array_elements(version_snapshot->'blocks') loop
    update public.page_blocks set
      position = (item->>'position')::integer,
      draft_config = item->'config',
      draft_visible = true,
      has_unpublished_changes = true,
      updated_at = now()
    where id = (item->>'id')::uuid and website_id = target_website and organization_id = target_org;
  end loop;

  for item in select * from jsonb_array_elements(version_snapshot->'entries') loop
    update public.content_entries set
      draft_value = item->'value',
      has_unpublished_changes = true,
      updated_at = now()
    where id = (item->>'id')::uuid and website_id = target_website and organization_id = target_org;
  end loop;

  insert into public.site_change_log
    (organization_id, website_id, actor_user_id, action, target_type, target_id, changes)
  values (
    target_org, target_website, auth.uid(), 'site.version_restored',
    'website', target_website::text, jsonb_build_object('version_id', target_version)
  );
end;
$$;

revoke all on function public.publish_website_draft(uuid, boolean) from public;
revoke all on function public.restore_website_version(uuid, uuid) from public;
grant execute on function public.publish_website_draft(uuid, boolean) to authenticated, service_role;
grant execute on function public.restore_website_version(uuid, uuid) to authenticated;

commit;
