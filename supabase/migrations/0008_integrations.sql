-- Línea App · Integraciones por proyecto (GA4, GTM, Google Ads, Meta Pixel)
-- Solo guarda los IDs de configuración; no hay OAuth ni llamadas a APIs
-- externas todavía (requiere credenciales de Google/Meta que no existen en
-- este entorno). "Conectado" = el campo tiene un valor guardado.

create table if not exists public.integration_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  ga4_measurement_id text,
  gtm_container_id text,
  google_ads_conversion_id text,
  meta_pixel_id text,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.integration_settings;
create trigger set_updated_at before update on public.integration_settings
  for each row execute function public.set_updated_at();

alter table public.integration_settings enable row level security;

drop policy if exists "integration_settings_select" on public.integration_settings;
create policy "integration_settings_select" on public.integration_settings for select to authenticated
  using (public.is_business_member(business_id) or public.is_linea_staff());

drop policy if exists "integration_settings_upsert" on public.integration_settings;
create policy "integration_settings_upsert" on public.integration_settings for insert to authenticated
  with check (public.is_business_member(business_id) or public.is_linea_staff());

drop policy if exists "integration_settings_update" on public.integration_settings;
create policy "integration_settings_update" on public.integration_settings for update to authenticated
  using (public.is_business_member(business_id) or public.is_linea_staff())
  with check (public.is_business_member(business_id) or public.is_linea_staff());

grant select, insert, update on public.integration_settings to authenticated;
