
insert into public.plans (code, name, features) values
('LITE', 'Línea App Lite', '{"dashboard":true,"leads":true,"content":true,"support":true,"site":false,"media":false,"analytics":false,"seo":false}'::jsonb),
('GROWTH', 'Growth', '{"dashboard":true,"leads":true,"site":true,"content":true,"media":true,"analytics":true,"seo":true,"support":true}'::jsonb),
('PRO', 'Pro', '{"dashboard":true,"leads":true,"site":true,"content":true,"media":true,"analytics":true,"seo":true,"support":true,"automations":true}'::jsonb)
on conflict (code) do update set name = excluded.name, features = excluded.features;

-- SOLO DESARROLLO. No ejecutar en el proyecto que contiene clientes de pago.
-- Para una prueba aislada, usa otro proyecto Supabase, crea allí un usuario
-- de Auth y sustituye DEMO_USER_UUID antes de añadir la membresía.

insert into public.organizations (id, name, slug, plan_code)
values ('4bd86e22-45a4-4af8-8e8c-45e6b827b7f3', 'DEMO · Clínica Dental Málaga Centro', 'demo-clinica-dental-malaga-centro', 'GROWTH')
on conflict (id) do nothing;

insert into public.websites (id, organization_id, name, domain, site_key, allowed_origin)
values (
  '15d755bc-dd91-4bad-942a-9d0d66cc2c31',
  '4bd86e22-45a4-4af8-8e8c-45e6b827b7f3',
  'Website principal',
  'clinicadentalmalaga.es',
  'demo_site_key_replace_before_production_123456789',
  'https://clinicadentalmalaga.es'
)
on conflict (id) do nothing;

insert into public.pages (id, organization_id, website_id, path, title, meta_description, draft_title, draft_meta_description, draft_is_indexable) values
('10000000-0000-4000-8000-000000000001','4bd86e22-45a4-4af8-8e8c-45e6b827b7f3','15d755bc-dd91-4bad-942a-9d0d66cc2c31','/','Clínica Dental en Málaga','Odontología cercana en el centro de Málaga.','Clínica Dental en Málaga','Odontología cercana en el centro de Málaga.',true),
('10000000-0000-4000-8000-000000000002','4bd86e22-45a4-4af8-8e8c-45e6b827b7f3','15d755bc-dd91-4bad-942a-9d0d66cc2c31','/implantes-dentales','Implantes dentales','Implantes dentales con diagnóstico y seguimiento.','Implantes dentales','Implantes dentales con diagnóstico y seguimiento.',true)
on conflict do nothing;

insert into public.page_blocks (id, organization_id, website_id, page_id, type, position, config, draft_config, is_published, draft_visible, has_unpublished_changes, published_at) values
('20000000-0000-4000-8000-000000000001','4bd86e22-45a4-4af8-8e8c-45e6b827b7f3','15d755bc-dd91-4bad-942a-9d0d66cc2c31','10000000-0000-4000-8000-000000000001','text',0,'{"eyebrow":"Salud y confianza","headingLevel":"h1","tone":"accent"}'::jsonb,'{"eyebrow":"Salud y confianza","headingLevel":"h1","tone":"accent"}'::jsonb,true,true,false,now()),
('20000000-0000-4000-8000-000000000002','4bd86e22-45a4-4af8-8e8c-45e6b827b7f3','15d755bc-dd91-4bad-942a-9d0d66cc2c31','10000000-0000-4000-8000-000000000001','cta',1,'{"headingLevel":"h2","tone":"accent"}'::jsonb,'{"headingLevel":"h2","tone":"accent"}'::jsonb,true,true,false,now())
on conflict (id) do nothing;

insert into public.content_entries (organization_id, website_id, page_id, block_id, content_key, label, value, draft_value, kind, has_unpublished_changes, published_at) values
('4bd86e22-45a4-4af8-8e8c-45e6b827b7f3','15d755bc-dd91-4bad-942a-9d0d66cc2c31','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','home.hero.heading','Título principal','"Tu clínica dental de confianza en el centro de Málaga"','"Tu clínica dental de confianza en el centro de Málaga"','text',false,now()),
('4bd86e22-45a4-4af8-8e8c-45e6b827b7f3','15d755bc-dd91-4bad-942a-9d0d66cc2c31','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','home.hero.body','Texto principal','"Odontología cercana, clara y pensada para ti."','"Odontología cercana, clara y pensada para ti."','rich_text',false,now()),
('4bd86e22-45a4-4af8-8e8c-45e6b827b7f3','15d755bc-dd91-4bad-942a-9d0d66cc2c31','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','home.cta.heading','Título de contacto','"¿Cuidamos tu sonrisa?"','"¿Cuidamos tu sonrisa?"','text',false,now()),
('4bd86e22-45a4-4af8-8e8c-45e6b827b7f3','15d755bc-dd91-4bad-942a-9d0d66cc2c31','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','home.cta.body','Texto de contacto','"Reserva una primera visita y cuéntanos qué necesitas."','"Reserva una primera visita y cuéntanos qué necesitas."','rich_text',false,now()),
('4bd86e22-45a4-4af8-8e8c-45e6b827b7f3','15d755bc-dd91-4bad-942a-9d0d66cc2c31','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','home.cta.button_label','Texto del botón','"Contactar"','"Contactar"','text',false,now()),
('4bd86e22-45a4-4af8-8e8c-45e6b827b7f3','15d755bc-dd91-4bad-942a-9d0d66cc2c31','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','home.cta.button_url','Enlace del botón','"#contacto"','"#contacto"','url',false,now())
on conflict do nothing;
