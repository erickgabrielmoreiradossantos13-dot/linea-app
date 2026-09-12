-- Imported-site editor: ZIP assets, pristine/annotated HTML and node-level mappings.

begin;

create table if not exists public.site_imports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  source_zip_path text not null unique,
  filename text not null,
  status text not null default 'UPLOADING' check (status in ('UPLOADING','PROCESSING','READY','FAILED')),
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, organization_id, website_id),
  constraint site_imports_website_org_fkey foreign key (website_id, organization_id)
    references public.websites(id, organization_id) on delete cascade
);

create table if not exists public.site_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  import_id uuid not null references public.site_imports(id) on delete cascade,
  path text not null,
  storage_path text not null unique,
  mime_type text not null,
  bytes bigint not null check (bytes >= 0 and bytes <= 52428800),
  created_at timestamptz not null default now(),
  unique (import_id, path),
  constraint site_files_import_org_website_fkey foreign key (import_id, organization_id, website_id)
    references public.site_imports(id, organization_id, website_id) on delete cascade
);

alter table public.websites
  add column if not exists source_mode text not null default 'BLOCKS',
  add column if not exists active_import_id uuid references public.site_imports(id) on delete set null;

alter table public.websites drop constraint if exists websites_source_mode_check;
alter table public.websites add constraint websites_source_mode_check check (source_mode in ('BLOCKS','IMPORTED'));

alter table public.pages
  add column if not exists editor_mode text not null default 'BLOCKS',
  add column if not exists import_id uuid references public.site_imports(id) on delete set null,
  add column if not exists source_file_path text,
  add column if not exists original_html text,
  add column if not exists template_html text,
  add column if not exists draft_html text,
  add column if not exists rendered_draft_html text,
  add column if not exists published_template_html text,
  add column if not exists published_html text;

alter table public.pages drop constraint if exists pages_editor_mode_check;
alter table public.pages add constraint pages_editor_mode_check check (editor_mode in ('BLOCKS','IMPORTED'));

alter table public.page_blocks
  add column if not exists selector text,
  add column if not exists attribute_name text,
  add column if not exists original_value jsonb,
  add column if not exists current_value_draft jsonb,
  add column if not exists current_value_published jsonb;

alter table public.page_blocks drop constraint if exists page_blocks_type_check;
alter table public.page_blocks add constraint page_blocks_type_check
  check (type in ('text','image_text','cards','cta','html_text','html_image','html_list'));

create index if not exists site_imports_website_time_idx on public.site_imports(organization_id, website_id, created_at desc);
create index if not exists site_files_lookup_idx on public.site_files(organization_id, website_id, import_id, path);
create index if not exists imported_blocks_page_position_idx on public.page_blocks(page_id, position) where selector is not null;

alter table public.site_imports enable row level security;
alter table public.site_files enable row level security;

create policy "site_imports_select_org" on public.site_imports for select to authenticated
  using (public.is_org_member(organization_id));
create policy "site_imports_insert_admin" on public.site_imports for insert to authenticated
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));
create policy "site_imports_update_admin" on public.site_imports for update to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));
create policy "site_imports_delete_admin" on public.site_imports for delete to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));

create policy "site_files_select_org" on public.site_files for select to authenticated
  using (public.is_org_member(organization_id));
create policy "site_files_insert_admin" on public.site_files for insert to authenticated
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));
create policy "site_files_update_admin" on public.site_files for update to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));
create policy "site_files_delete_admin" on public.site_files for delete to authenticated
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));

grant select, insert, update, delete on public.site_imports to authenticated;
grant select, insert, update, delete on public.site_files to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sites', 'sites', false, 52428800, null)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create policy "site_objects_select" on storage.objects for select to authenticated
  using (bucket_id = 'sites' and public.is_org_member(((storage.foldername(name))[1])::uuid));
create policy "site_objects_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'sites' and public.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['OWNER','ADMIN']::public.organization_role[]
  ));
create policy "site_objects_update" on storage.objects for update to authenticated
  using (bucket_id = 'sites' and public.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['OWNER','ADMIN']::public.organization_role[]
  ));
create policy "site_objects_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'sites' and public.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['OWNER','ADMIN']::public.organization_role[]
  ));

create or replace function public.replace_website_import(
  target_website uuid,
  target_import uuid,
  pages_payload jsonb,
  blocks_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org uuid;
begin
  select organization_id into target_org from public.websites where id = target_website and status = 'ACTIVE';
  if target_org is null then raise exception 'website_not_found'; end if;
  if not public.has_org_role(target_org, array['OWNER','ADMIN']::public.organization_role[]) then
    raise exception 'import_requires_admin';
  end if;
  if not exists (
    select 1 from public.site_imports
    where id = target_import and website_id = target_website and organization_id = target_org
  ) then raise exception 'import_not_found'; end if;

  delete from public.pages where website_id = target_website and organization_id = target_org;

  insert into public.pages (
    id, organization_id, website_id, path, title, meta_description, is_indexable,
    draft_title, draft_meta_description, draft_is_indexable, has_unpublished_changes,
    editor_mode, import_id, source_file_path, original_html, template_html, draft_html,
    rendered_draft_html, published_template_html, published_html, published_at
  )
  select
    (item->>'id')::uuid, target_org, target_website, item->>'path', item->>'title',
    nullif(item->>'metaDescription', ''), true, item->>'title', nullif(item->>'metaDescription', ''), true, false,
    'IMPORTED', target_import, item->>'sourceFilePath', item->>'originalHtml', item->>'templateHtml',
    item->>'templateHtml', item->>'publishedHtml', item->>'templateHtml', item->>'publishedHtml', now()
  from jsonb_array_elements(pages_payload) item;

  insert into public.page_blocks (
    id, organization_id, website_id, page_id, type, position, config, draft_config,
    is_published, draft_visible, has_unpublished_changes, selector, attribute_name,
    original_value, current_value_draft, current_value_published, published_at, updated_by
  )
  select
    (item->>'id')::uuid, target_org, target_website, (item->>'pageId')::uuid,
    item->>'type', (item->>'position')::integer, '{}'::jsonb, '{}'::jsonb,
    true, true, false, item->>'selector', nullif(item->>'attributeName', ''),
    item->'originalValue', item->'originalValue', item->'originalValue', now(), auth.uid()
  from jsonb_array_elements(blocks_payload) item;

  update public.site_imports set status = 'READY', error_message = null, completed_at = now()
  where id = target_import and website_id = target_website and organization_id = target_org;
  update public.websites set source_mode = 'IMPORTED', active_import_id = target_import,
    published_at = now(), updated_at = now()
  where id = target_website and organization_id = target_org;

  insert into public.site_change_log
    (organization_id, website_id, actor_user_id, action, target_type, target_id, changes)
  values (target_org, target_website, auth.uid(), 'site.imported', 'website', target_website::text,
    jsonb_build_object('import_id', target_import, 'pages', jsonb_array_length(pages_payload)));
end;
$$;

revoke all on function public.replace_website_import(uuid, uuid, jsonb, jsonb) from public;
grant execute on function public.replace_website_import(uuid, uuid, jsonb, jsonb) to authenticated;

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
    new.config is distinct from old.config or new.is_published is distinct from old.is_published or
    new.published_at is distinct from old.published_at or
    new.current_value_published is distinct from old.current_value_published
  ) and not public.has_org_role(target_org, array['OWNER','ADMIN']::public.organization_role[]) then
    raise exception 'publish_requires_admin';
  end if;
  if tg_table_name = 'content_entries' and (
    new.value is distinct from old.value or new.published_at is distinct from old.published_at
  ) and not public.has_org_role(target_org, array['OWNER','ADMIN']::public.organization_role[]) then
    raise exception 'publish_requires_admin';
  end if;
  if tg_table_name = 'pages' and (
    new.title is distinct from old.title or new.meta_description is distinct from old.meta_description or
    new.is_indexable is distinct from old.is_indexable or new.published_at is distinct from old.published_at or
    new.published_html is distinct from old.published_html or
    new.published_template_html is distinct from old.published_template_html
  ) and not public.has_org_role(target_org, array['OWNER','ADMIN']::public.organization_role[]) then
    raise exception 'publish_requires_admin';
  end if;
  return new;
end;
$$;

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
  select organization_id into target_org from public.websites where id = target_website and status = 'ACTIVE';
  if target_org is null then raise exception 'website_not_found'; end if;
  if auth.role() <> 'service_role' and not public.has_org_role(target_org, array['OWNER','ADMIN']::public.organization_role[]) then
    raise exception 'publish_requires_admin';
  end if;

  published_snapshot := jsonb_build_object(
    'websiteId', target_website,
    'pages', coalesce((select jsonb_agg(jsonb_build_object(
      'id', p.id, 'title', p.draft_title, 'metaDescription', p.draft_meta_description,
      'isIndexable', p.draft_is_indexable, 'draftHtml', p.draft_html,
      'renderedDraftHtml', p.rendered_draft_html, 'editorMode', p.editor_mode
    ) order by p.path) from public.pages p where p.website_id = target_website and p.organization_id = target_org), '[]'::jsonb),
    'blocks', coalesce((select jsonb_agg(jsonb_build_object(
      'id', b.id, 'pageId', b.page_id, 'type', b.type, 'position', b.position,
      'config', b.draft_config, 'draftVisible', b.draft_visible, 'currentValue', b.current_value_draft
    ) order by b.page_id, b.position) from public.page_blocks b
      where b.website_id = target_website and b.organization_id = target_org), '[]'::jsonb),
    'entries', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'value', c.draft_value))
      from public.content_entries c join public.page_blocks b on b.id = c.block_id and b.organization_id = c.organization_id
      where c.website_id = target_website and c.organization_id = target_org and b.draft_visible), '[]'::jsonb)
  );

  insert into public.site_versions (organization_id, website_id, actor_user_id, label, snapshot)
  values (target_org, target_website, actor_id,
    case when scheduled_run then 'Publicação programada' else 'Publicação manual' end, published_snapshot)
  returning id into version_id;

  update public.pages set title = draft_title, meta_description = draft_meta_description,
    is_indexable = draft_is_indexable,
    published_template_html = case when editor_mode = 'IMPORTED' then draft_html else published_template_html end,
    published_html = case when editor_mode = 'IMPORTED' then rendered_draft_html else published_html end,
    has_unpublished_changes = false, published_at = now_at, updated_at = now_at
  where website_id = target_website and organization_id = target_org;
  update public.page_blocks set config = draft_config, is_published = draft_visible,
    current_value_published = current_value_draft, has_unpublished_changes = false,
    published_at = now_at, updated_at = now_at
  where website_id = target_website and organization_id = target_org;
  update public.content_entries set value = draft_value, has_unpublished_changes = false,
    published_at = now_at, updated_at = now_at
  where website_id = target_website and organization_id = target_org;
  update public.websites set published_at = now_at, publish_at = null, updated_at = now_at
  where id = target_website and organization_id = target_org;
  insert into public.site_change_log
    (organization_id, website_id, actor_user_id, action, target_type, target_id, changes)
  values (target_org, target_website, actor_id,
    case when scheduled_run then 'site.published_scheduled' else 'site.published' end,
    'website', target_website::text, jsonb_build_object('version_id', version_id));
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
    update public.pages set draft_title = item->>'title', draft_meta_description = item->>'metaDescription',
      draft_is_indexable = coalesce((item->>'isIndexable')::boolean, true),
      draft_html = coalesce(item->>'draftHtml', draft_html),
      rendered_draft_html = coalesce(item->>'renderedDraftHtml', rendered_draft_html),
      has_unpublished_changes = true, updated_at = now()
    where id = (item->>'id')::uuid and website_id = target_website and organization_id = target_org;
  end loop;
  for item in select * from jsonb_array_elements(version_snapshot->'blocks') loop
    update public.page_blocks set position = (item->>'position')::integer,
      draft_config = item->'config', draft_visible = coalesce((item->>'draftVisible')::boolean, true),
      current_value_draft = coalesce(item->'currentValue', current_value_draft),
      has_unpublished_changes = true, updated_at = now()
    where id = (item->>'id')::uuid and website_id = target_website and organization_id = target_org;
  end loop;
  for item in select * from jsonb_array_elements(version_snapshot->'entries') loop
    update public.content_entries set draft_value = item->'value', has_unpublished_changes = true, updated_at = now()
    where id = (item->>'id')::uuid and website_id = target_website and organization_id = target_org;
  end loop;
  insert into public.site_change_log
    (organization_id, website_id, actor_user_id, action, target_type, target_id, changes)
  values (target_org, target_website, auth.uid(), 'site.version_restored',
    'website', target_website::text, jsonb_build_object('version_id', target_version));
end;
$$;

commit;
