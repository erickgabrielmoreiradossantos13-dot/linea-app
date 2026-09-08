-- Línea App · Historial de comentarios en Solicitudes (Fase Soporte)

create table if not exists public.support_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.support_requests(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  author_email text,
  is_staff boolean not null default false,
  comment text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_comments_request_id_idx on public.support_comments(request_id, created_at);

alter table public.support_comments enable row level security;

drop policy if exists "support_comments_select" on public.support_comments;
create policy "support_comments_select" on public.support_comments for select to authenticated
  using (public.is_business_member(business_id) or public.is_linea_staff());

drop policy if exists "support_comments_insert" on public.support_comments;
create policy "support_comments_insert" on public.support_comments for insert to authenticated
  with check (public.is_business_member(business_id) or public.is_linea_staff());

grant select, insert on public.support_comments to authenticated;
