-- Línea App · Seed de demo (v0)
-- Crea el negocio demo "Clínica Aurora" (Málaga), un usuario de acceso,
-- contenido web, y datos de analítica/leads de los últimos 30 días.
--
-- Ejecutar en el SQL Editor de Supabase (rol postgres) o vía:
--   supabase db execute -f supabase/seed.sql
--
-- Es idempotente: se puede volver a ejecutar sin duplicar datos.
-- Usuario demo: demo@lineasur.app / LineaDemo2026!

create extension if not exists pgcrypto;

do $$
declare
  v_business_id uuid;
  v_user_id uuid;
  v_email text := 'demo@lineasur.app';
  v_password text := 'LineaDemo2026!';
  v_names text[] := array[
    'Laura','Carlos','María','Javier','Ana','Pedro','Lucía','Diego','Elena','Sergio',
    'Marta','Alejandro','Cristina','Pablo','Sara','Miguel','Beatriz','Raúl','Nuria','Iván'
  ];
  v_surnames text[] := array[
    'Gómez','Ruiz','Fernández','López','Martín','Sánchez','Torres','Romero','Navarro','Ortega',
    'Jiménez','Molina','Delgado','Castro','Ramos','Vega','Iglesias','Serrano','Campos','Herrera'
  ];
  v_services text[] := array['Implantes', 'Ortodoncia', 'Estética dental', 'Revisión general', 'Blanqueamiento'];
  v_prices numeric[] := array[450, 300, 180, 60, 90];
  v_statuses text[] := array['nuevo','nuevo','contactado','contactado','cita','ganado','ganado','perdido','nuevo','contactado'];
  v_statuses_prev text[] := array['ganado','ganado','perdido','contactado','ganado','cita'];
  v_site_id uuid;
  v_page_id uuid;
  v_hero_id uuid;
  v_contact_id uuid;
  v_field_title uuid;
  v_field_subtitle uuid;
  v_field_cta uuid;
  v_field_phone uuid;
  v_field_whatsapp uuid;
begin
  -- 1) Negocio demo -----------------------------------------------------
  insert into public.businesses (name, city, slug, linea_score, is_demo, avg_client_value, close_rate, next_review_date)
  values ('Clínica Aurora', 'Málaga', 'clinica-aurora', 78, true, 550, 0.30, current_date + interval '14 days')
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    avg_client_value = excluded.avg_client_value,
    close_rate = excluded.close_rate,
    next_review_date = excluded.next_review_date
  returning id into v_business_id;

  -- 2) Usuario demo (idempotente) ---------------------------------------
  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated', v_email,
      crypt(v_password, gen_salt('bf')),
      now(), '', '', '', '',
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id, v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email', now(), now(), now()
    );
  end if;

  -- 3) Vincular usuario <-> negocio (admin) ------------------------------
  insert into public.business_members (business_id, user_id, role)
  values (v_business_id, v_user_id, 'admin')
  on conflict (business_id, user_id) do nothing;

  -- 4) Contenido de la web (borrador = publicado al inicio) --------------
  insert into public.website_content (
    business_id, headline, description, cta_text, phone, whatsapp,
    published_headline, published_description, published_cta_text, published_phone, published_whatsapp,
    published_at
  ) values (
    v_business_id,
    'Cuida tu sonrisa con los mejores especialistas de Málaga',
    'En Clínica Aurora combinamos tecnología avanzada y trato cercano para ofrecerte tratamientos dentales de máxima calidad.',
    'Pide tu cita',
    '+34 951 234 567',
    '+34 611 222 333',
    'Cuida tu sonrisa con los mejores especialistas de Málaga',
    'En Clínica Aurora combinamos tecnología avanzada y trato cercano para ofrecerte tratamientos dentales de máxima calidad.',
    'Pide tu cita',
    '+34 951 234 567',
    '+34 611 222 333',
    now() - interval '10 days'
  )
  on conflict (business_id) do nothing;

  -- 5) Limpiar datos demo previos (para poder re-ejecutar el seed) -------
  delete from public.leads where business_id = v_business_id and is_demo = true;
  delete from public.analytics_events where business_id = v_business_id and is_demo = true;
  delete from public.improvement_plan_items where business_id = v_business_id and is_demo = true;

  -- 6) Analítica: 2.418 visitas en los últimos 30 días --------------------
  -- Distribución de fuentes ponderada (Google > Instagram/Facebook/Directo > Referido)
  -- y sesgo hacia días recientes para mostrar una tendencia de crecimiento realista.
  insert into public.analytics_events (business_id, event_type, source, occurred_at, is_demo)
  select
    v_business_id,
    'visit',
    case (i % 10)
      when 0 then 'google' when 1 then 'google'
      when 2 then 'google_maps'
      when 3 then 'instagram' when 4 then 'instagram'
      when 5 then 'facebook' when 6 then 'facebook'
      when 7 then 'directo' when 8 then 'directo'
      else 'referido'
    end,
    (current_date - (
      29 - floor(
        30 * (0.55 * (i / 2418.0) + 0.45 * (((i * 9301 + 49297) % 233280) / 233280.0))
      )::int
    )::int) + (((i * 37) % 86400) * interval '1 second'),
    true
  from generate_series(1, 2418) as i;

  -- 6b) Analítica del periodo anterior (30-59 días), para poder comparar
  -- "vs. mes anterior" también en modo Supabase real. ~82% del volumen actual.
  insert into public.analytics_events (business_id, event_type, source, occurred_at, is_demo)
  select
    v_business_id,
    'visit',
    case (i % 10)
      when 0 then 'google' when 1 then 'google'
      when 2 then 'google_maps'
      when 3 then 'instagram' when 4 then 'instagram'
      when 5 then 'facebook' when 6 then 'facebook'
      when 7 then 'directo' when 8 then 'directo'
      else 'referido'
    end,
    (current_date - (30 + (i % 30))) + (((i * 41) % 86400) * interval '1 second'),
    true
  from generate_series(1, 1980) as i;

  -- 7) Leads: 83 en total -> 51 WhatsApp, 19 formulario, 13 llamada -------
  insert into public.leads (
    business_id, name, phone, email, service, source, status, value_estimate, created_at, is_demo
  )
  select
    v_business_id,
    v_names[(gs % array_length(v_names, 1)) + 1] || ' ' || v_surnames[((gs * 7) % array_length(v_surnames, 1)) + 1],
    '+34 6' || lpad((((gs * 123457) % 100000000))::text, 8, '0'),
    lower(v_names[(gs % array_length(v_names, 1)) + 1]) || '.' || lower(v_surnames[((gs * 7) % array_length(v_surnames, 1)) + 1]) || gs || '@ejemplo.com',
    v_services[(gs % array_length(v_services, 1)) + 1],
    case when gs <= 51 then 'whatsapp' when gs <= 70 then 'formulario' else 'llamada' end,
    v_statuses[(gs % array_length(v_statuses, 1)) + 1],
    v_prices[(gs % array_length(v_prices, 1)) + 1],
    now() - (greatest(0, 29 - floor(29 * (gs / 83.0)) - (gs % 3)) * interval '1 day') - ((gs * 53) % 86400) * interval '1 second',
    true
  from generate_series(1, 83) as gs;

  -- 7b) Leads del periodo anterior (30-59 días), ~77% del volumen actual,
  -- ya resueltos en su mayoría (para poder comparar "vs. mes anterior").
  insert into public.leads (
    business_id, name, phone, email, service, source, status, value_estimate, created_at, is_demo
  )
  select
    v_business_id,
    v_names[(gs % array_length(v_names, 1)) + 1] || ' ' || v_surnames[((gs * 11) % array_length(v_surnames, 1)) + 1],
    '+34 6' || lpad((((gs * 654321) % 100000000))::text, 8, '0'),
    lower(v_names[(gs % array_length(v_names, 1)) + 1]) || '.' || lower(v_surnames[((gs * 11) % array_length(v_surnames, 1)) + 1]) || 'p' || gs || '@ejemplo.com',
    v_services[(gs % array_length(v_services, 1)) + 1],
    case when gs <= 39 then 'whatsapp' when gs <= 54 then 'formulario' else 'llamada' end,
    v_statuses_prev[(gs % array_length(v_statuses_prev, 1)) + 1],
    v_prices[(gs % array_length(v_prices, 1)) + 1],
    (current_date - (30 + (gs % 30))) - ((gs * 29) % 86400) * interval '1 second',
    true
  from generate_series(1, 64) as gs;

  -- 8) Plan de mejora: tareas de ejemplo que Línea Sur gestiona para el cliente
  insert into public.improvement_plan_items (business_id, title, status, position, is_demo)
  values
    (v_business_id, 'Mejorar la página de tratamientos', 'completado', 1, true),
    (v_business_id, 'Optimizar el perfil de Google Negocio', 'completado', 2, true),
    (v_business_id, 'Crear página "Implantes dentales Málaga"', 'en_progreso', 3, true),
    (v_business_id, 'Mejorar la conversión en móvil', 'pendiente', 4, true),
    (v_business_id, 'Añadir reseñas de clientes en la web', 'pendiente', 5, true);

  -- 9) Equipo de Línea Sur: el usuario demo también puede ver /dashboard/admin/sites
  insert into public.linea_staff (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  -- 10) Site / Editable Schema: migra el contenido de website_content (los
  -- mismos 5 campos de siempre) a la nueva arquitectura genérica.
  delete from public.sites where business_id = v_business_id and is_demo = true;

  insert into public.sites (business_id, name, domain, production_url, framework, status, last_published_at, is_demo)
  values (v_business_id, 'Clínica Aurora', 'auroraclinica.es', 'https://auroraclinica.es', 'linea-nextjs', 'published', now() - interval '10 days', true)
  returning id into v_site_id;

  insert into public.site_pages (site_id, slug, name, position)
  values (v_site_id, 'inicio', 'Inicio', 1)
  returning id into v_page_id;

  insert into public.site_sections (page_id, key, name, position)
  values (v_page_id, 'hero', 'Hero', 1)
  returning id into v_hero_id;

  insert into public.site_sections (page_id, key, name, position)
  values (v_page_id, 'contact', 'Contacto', 2)
  returning id into v_contact_id;

  insert into public.site_fields (section_id, key, label, field_type, position, config)
  values (v_hero_id, 'title', 'Título principal', 'text', 1, jsonb_build_object('maxLength', 80))
  returning id into v_field_title;

  insert into public.site_fields (section_id, key, label, field_type, position, config)
  values (v_hero_id, 'subtitle', 'Descripción', 'textarea', 2, jsonb_build_object('maxLength', 280))
  returning id into v_field_subtitle;

  insert into public.site_fields (section_id, key, label, field_type, position, config)
  values (v_hero_id, 'ctaLabel', 'Texto del botón', 'text', 3, jsonb_build_object('maxLength', 30))
  returning id into v_field_cta;

  insert into public.site_fields (section_id, key, label, field_type, position, config)
  values (v_contact_id, 'phone', 'Teléfono', 'phone', 1, '{}')
  returning id into v_field_phone;

  insert into public.site_fields (section_id, key, label, field_type, position, config)
  values (v_contact_id, 'whatsapp', 'WhatsApp', 'phone', 2, '{}')
  returning id into v_field_whatsapp;

  insert into public.site_field_values (field_id, draft_value, published_value, published_at)
  select v_field_title, to_jsonb(headline), to_jsonb(published_headline), published_at from public.website_content where business_id = v_business_id
  union all
  select v_field_subtitle, to_jsonb(description), to_jsonb(published_description), published_at from public.website_content where business_id = v_business_id
  union all
  select v_field_cta, to_jsonb(cta_text), to_jsonb(published_cta_text), published_at from public.website_content where business_id = v_business_id
  union all
  select v_field_phone, to_jsonb(phone), to_jsonb(published_phone), published_at from public.website_content where business_id = v_business_id
  union all
  select v_field_whatsapp, to_jsonb(whatsapp), to_jsonb(published_whatsapp), published_at from public.website_content where business_id = v_business_id;

  insert into public.site_change_log (site_id, actor_email, summary, created_at)
  values (v_site_id, 'Línea Sur', 'Sitio conectado a Línea App', now() - interval '10 days');

end $$;
