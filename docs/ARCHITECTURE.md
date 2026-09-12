# Arquitectura — Línea App MVP

## Fronteira de tenant

A unidade de isolamento é `organization_id`. Dados de cliente nunca dependem de um `organization_id` vindo do browser para autorização. O servidor deriva a organização da sessão e o banco aplica RLS.

Papéis de organização:
- OWNER
- ADMIN
- EDITOR
- VIEWER

`SUPER_ADMIN` não é um papel de organização. É um atributo global em `profiles.is_super_admin`, reservado à equipe Línea Sur.

## Sessão

1. Supabase Auth valida o usuário.
2. `getSessionContext()` carrega organizações permitidas.
3. A organização ativa pode ser escolhida por cookie HTTP-only `linea_org`.
4. O cookie só é aceito se a organização estiver na lista autorizada.
5. O plano da organização carrega `plans.features`.
6. Navegação, rotas e ações aplicam feature gating.

## RLS

As principais tabelas possuem RLS:
- organizations
- organization_members
- websites
- pages
- content_entries
- media
- leads
- lead_notes
- analytics_events
- integrations
- support_tickets
- subscriptions
- notifications
- audit_logs

Funções `security definer` são reduzidas, têm `search_path` fixo e execução pública revogada.

## Ingestão pública

Sites da Línea Sur enviam:
- leads;
- eventos comerciais.

O `site_key` identifica o website. Como aparece no browser, não é considerado segredo forte. O endpoint valida o `Origin` cadastrado e precisa de rate limiting no edge antes de escala.

## Conteúdo

Clientes editam registros estruturados (`content_key` + `value`) em vez de HTML ou layout. Isso preserva a arquitetura visual do site.

## Mídia

Uploads:
- bucket privado `media`;
- pasta iniciada por `organization_id`;
- tipos MIME permitidos: JPEG, PNG, WebP e AVIF;
- limite de 15 MB;
- RLS no `storage.objects`;
- registro correspondente em `public.media`.

## Billing

A estrutura de `plans` e `subscriptions` já existe, mas Stripe ainda não está conectado. O cliente não recebe permissão de escrita nos campos de plano/billing.

## Dados demo

`NEXT_PUBLIC_DEMO_MODE=true` permite navegar sem Supabase. Dados demo são explicitamente fictícios e não são apresentados como produção.
