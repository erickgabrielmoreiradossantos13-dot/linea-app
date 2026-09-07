-- Línea App · Notas de contactos (Fase 7: mini-CRM)
-- Aditivo: no toca ninguna tabla existente.

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_email text,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_notes_lead_id_idx on public.lead_notes(lead_id, created_at desc);

alter table public.lead_notes enable row level security;

-- Mismo criterio que leads: solo miembros del negocio del lead.
drop policy if exists "lead_notes_select_members" on public.lead_notes;
create policy "lead_notes_select_members"
  on public.lead_notes for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "lead_notes_insert_members" on public.lead_notes;
create policy "lead_notes_insert_members"
  on public.lead_notes for insert
  to authenticated
  with check (public.is_business_member(business_id));

grant select, insert on public.lead_notes to authenticated;
