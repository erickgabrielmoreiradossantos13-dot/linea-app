create extension if not exists pgcrypto;

create type public.organization_role as enum ('OWNER','ADMIN','EDITOR','VIEWER');
create type public.membership_status as enum ('INVITED','ACTIVE','SUSPENDED');
create type public.lead_status as enum ('NEW','CONTACTED','QUALIFIED','MEETING','PROPOSAL','WON','LOST');
create type public.website_status as enum ('ACTIVE','PAUSED','ARCHIVED');
create type public.ticket_status as enum ('OPEN','IN_PROGRESS','WAITING_CUSTOMER','RESOLVED');
create type public.ticket_priority as enum ('LOW','NORMAL','HIGH','URGENT');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  locale text not null default 'es-ES',
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique,
  plan_code text not null default 'LITE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'VIEWER',
  status public.membership_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index organization_members_user_idx on public.organization_members(user_id, status);

create table public.websites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  domain text not null,
  site_key text not null unique default encode(gen_random_bytes(32), 'hex'),
  allowed_origin text,
  status public.website_status not null default 'ACTIVE',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, domain)
);
create index websites_org_idx on public.websites(organization_id);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  path text not null,
  title text not null,
  meta_description text,
  is_indexable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (website_id, path)
);
create index pages_org_idx on public.pages(organization_id);

create table public.content_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  content_key text not null,
  label text not null,
  value jsonb not null default 'null'::jsonb,
  kind text not null default 'text',
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (website_id, content_key)
);
create index content_entries_org_idx on public.content_entries(organization_id);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid references public.websites(id) on delete cascade,
  storage_path text not null unique,
  filename text not null,
  mime_type text not null,
  bytes bigint not null check (bytes >= 0 and bytes <= 15728640),
  alt_text text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index media_org_idx on public.media(organization_id);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid references public.websites(id) on delete set null,
  name text not null,
  email text,
  phone text,
  whatsapp text,
  company text,
  source text,
  page_path text,
  message text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  status public.lead_status not null default 'NEW',
  assigned_to uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_org_created_idx on public.leads(organization_id, created_at desc);
create index leads_org_status_idx on public.leads(organization_id, status);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  note text not null check (char_length(note) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index lead_notes_lead_idx on public.lead_notes(lead_id, created_at);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  event_type text not null,
  page_path text,
  session_id text,
  source text,
  medium text,
  campaign text,
  occurred_at timestamptz not null default now()
);
create index analytics_org_time_idx on public.analytics_events(organization_id, occurred_at desc);
create index analytics_website_event_idx on public.analytics_events(website_id, event_type, occurred_at desc);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  status text not null default 'DISCONNECTED',
  config jsonb not null default '{}'::jsonb,
  last_error text,
  connected_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  subject text not null,
  description text not null,
  priority public.ticket_priority not null default 'NORMAL',
  status public.ticket_status not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index support_tickets_org_status_idx on public.support_tickets(organization_id, status);


create table public.plans (
  code text primary key,
  name text not null,
  active boolean not null default true,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


insert into public.plans (code, name, features) values
('LITE', 'Línea App Lite', '{"dashboard":true,"leads":true,"content":true,"support":true,"site":false,"media":false,"analytics":false,"seo":false}'::jsonb),
('GROWTH', 'Growth', '{"dashboard":true,"leads":true,"site":true,"content":true,"media":true,"analytics":true,"seo":true,"support":true}'::jsonb),
('PRO', 'Pro', '{"dashboard":true,"leads":true,"site":true,"content":true,"media":true,"analytics":true,"seo":true,"support":true,"automations":true}'::jsonb)
on conflict (code) do update set name = excluded.name, features = excluded.features;

alter table public.organizations
  add constraint organizations_plan_code_fkey foreign key (plan_code) references public.plans(code);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text unique,
  plan_code text references public.plans(code),
  status text not null default 'INACTIVE',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, read_at, created_at desc);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_org_time_idx on public.audit_logs(organization_id, created_at desc);


create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_super_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
  );
$$;

create or replace function public.has_org_role(target_org uuid, allowed_roles public.organization_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
      and m.role = any(allowed_roles)
  );
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.websites enable row level security;
alter table public.pages enable row level security;
alter table public.content_entries enable row level security;
alter table public.media enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.analytics_events enable row level security;
alter table public.integrations enable row level security;
alter table public.support_tickets enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "profile_self_select" on public.profiles for select using (id = auth.uid() or public.is_super_admin());
create policy "profile_self_update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "organizations_member_select" on public.organizations for select using (public.is_org_member(id));
create policy "organizations_admin_update" on public.organizations for update
  using (public.has_org_role(id, array['OWNER','ADMIN']::public.organization_role[]))
  with check (public.has_org_role(id, array['OWNER','ADMIN']::public.organization_role[]));
create policy "members_member_select" on public.organization_members for select using (public.is_org_member(organization_id));
create policy "members_owner_manage" on public.organization_members for all
  using (public.has_org_role(organization_id, array['OWNER']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER']::public.organization_role[]));

create policy "websites_member_select" on public.websites for select using (public.is_org_member(organization_id));
create policy "websites_admin_write" on public.websites for all
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));

create policy "pages_member_select" on public.pages for select using (public.is_org_member(organization_id));
create policy "pages_editor_write" on public.pages for all
  using (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));

create policy "content_member_select" on public.content_entries for select using (public.is_org_member(organization_id));
create policy "content_editor_write" on public.content_entries for all
  using (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));

create policy "media_member_select" on public.media for select using (public.is_org_member(organization_id));
create policy "media_editor_write" on public.media for all
  using (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN','EDITOR']::public.organization_role[]));

create policy "leads_member_select" on public.leads for select using (public.is_org_member(organization_id));
create policy "leads_admin_write" on public.leads for all
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));

create policy "lead_notes_member_select" on public.lead_notes for select using (public.is_org_member(organization_id));
create policy "lead_notes_admin_write" on public.lead_notes for all
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));

create policy "analytics_member_select" on public.analytics_events for select using (public.is_org_member(organization_id));
create policy "integrations_member_select" on public.integrations for select using (public.is_org_member(organization_id));
create policy "integrations_owner_write" on public.integrations for all
  using (public.has_org_role(organization_id, array['OWNER']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER']::public.organization_role[]));

create policy "tickets_member_select" on public.support_tickets for select using (public.is_org_member(organization_id));
create policy "tickets_member_insert" on public.support_tickets for insert with check (public.is_org_member(organization_id));
create policy "tickets_admin_update" on public.support_tickets for update
  using (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]))
  with check (public.has_org_role(organization_id, array['OWNER','ADMIN']::public.organization_role[]));

create policy "plans_authenticated_select" on public.plans for select to authenticated using (active = true or public.is_super_admin());
create policy "subscriptions_member_select" on public.subscriptions for select using (public.is_org_member(organization_id));
create policy "notifications_user_select" on public.notifications for select using (user_id = auth.uid() or public.is_super_admin());
create policy "notifications_user_update" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "audit_member_select" on public.audit_logs for select
  using (public.has_org_role(organization_id, array['OWNER']::public.organization_role[]));
create policy "audit_actor_insert" on public.audit_logs for insert
  with check (actor_user_id = auth.uid() and public.is_org_member(organization_id));



create or replace function public.create_organization_for_current_user(org_name text, org_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;
  if char_length(trim(org_name)) < 2 or char_length(trim(org_name)) > 160 then
    raise exception 'invalid_org_name';
  end if;
  if org_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' or char_length(org_slug) > 80 then
    raise exception 'invalid_org_slug';
  end if;

  insert into public.organizations (name, slug)
  values (trim(org_name), org_slug)
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (new_org_id, current_user_id, 'OWNER', 'ACTIVE');

  insert into public.audit_logs (organization_id, actor_user_id, action, target_type, target_id)
  values (new_org_id, current_user_id, 'organization.created', 'organization', new_org_id::text);

  return new_org_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 15728640, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "media_objects_select" on storage.objects for select to authenticated
using (
  bucket_id = 'media'
  and public.is_org_member(((storage.foldername(name))[1])::uuid)
);

create policy "media_objects_insert" on storage.objects for insert to authenticated
with check (
  bucket_id = 'media'
  and public.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['OWNER','ADMIN','EDITOR']::public.organization_role[]
  )
);

create policy "media_objects_delete" on storage.objects for delete to authenticated
using (
  bucket_id = 'media'
  and public.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['OWNER','ADMIN','EDITOR']::public.organization_role[]
  )
);

-- Explicitly prevent clients from escalating themselves to Línea Sur super admin
-- or changing plan/billing fields directly.
revoke update on public.profiles from authenticated;
grant update (full_name, locale) on public.profiles to authenticated;

revoke update on public.organizations from authenticated;
grant update (name, updated_at) on public.organizations to authenticated;

revoke all on function public.is_super_admin() from public;
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, public.organization_role[]) from public;
revoke all on function public.create_organization_for_current_user(text, text) from public;
revoke all on function public.handle_new_user() from public;

grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.organization_role[]) to authenticated;
grant execute on function public.create_organization_for_current_user(text, text) to authenticated;
