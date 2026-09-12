# Línea App

SaaS multi-tenant da Línea Sur Digital Studio para transformar presença digital em um painel comercial: leads, métricas, conteúdo, websites, suporte e administração.

## Estado deste incremento

Implementado no código:
- Next.js App Router + TypeScript + Tailwind
- modo demo explícito, sem fingir integrações reais
- autenticação Supabase preparada
- organizações, papéis e RLS multi-tenant
- dashboard executivo
- CRM de leads con lista, Kanban y seguimiento
- conteúdo estruturado
- websites
- soporte con respuesta y cierre por Super Admin
- configurações da organização
- biblioteca de mídia com validação e Storage privado
- onboarding com criação atômica de organização + OWNER
- administración global y cola de soporte
- recuperación completa de contraseña
- invitaciones de equipo con roles
- diagnóstico SEO automático y checklist manual
- constructor visual de sitios con edición directa, borradores y preview responsive
- bloques ordenables (texto, imagen + texto, tarjetas y CTA)
- historial de versiones recuperable y publicación manual o programada
- imágenes redimensionadas y convertidas a WebP antes de Storage
- endpoints públicos para leads e eventos
- migration inicial + seed
- testes unitários de autorização e E2E smoke spec

Ainda exige credenciais externas para validação completa:
- Supabase real
- Vercel
- Stripe
- Resend

## Requisitos

- Node.js 22+
- npm
- um projeto Supabase para modo real

## Instalação

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abra `http://localhost:3000`.

Com `NEXT_PUBLIC_DEMO_MODE=true`, a interface usa dados fictícios e não exige credenciais.

## Produção

1. Crie um projeto Supabase.
2. Configure as variáveis de `.env.example`.
3. Ejecute, en orden, todos los archivos de `supabase/migrations/`.
4. No ejecute `supabase/seed.sql` en el proyecto que contiene clientes de pago.
5. Defina `NEXT_PUBLIC_DEMO_MODE=false`.
6. Rode:
   ```bash
   npm run typecheck
   npm run lint
   npm run test:unit
   npm run build
   ```
7. Configure as mesmas variáveis no Vercel.

## Editor visual

El flujo principal de contenido abre `/site/{websiteId}/edit`. El canvas usa el
mismo renderer que la ruta pública `/sites/{websiteId}/{path}`: un texto se
edita haciendo clic sobre él y se guarda en `content_entries.draft_value`; las
secciones viven en `page_blocks.draft_config`. La versión publicada continúa en
`content_entries.value` y `page_blocks.config` hasta que un OWNER o ADMIN pulsa
**Publicar**.

### Sites reais importados por ZIP

O caminho principal da versão 0.6 é **Mi web → Importar o site real**. O browser
envia o ZIP diretamente ao bucket privado `sites`, evitando passar arquivos
grandes pelo servidor da aplicação. No servidor, Cheerio e JSZip:

1. preservam o HTML recebido em `pages.original_html`;
2. reescrevem referências relativas para o proxy seguro `/site-assets/...`;
3. marcam textos, imagens e listas repetidas numa cópia de trabalho;
4. criam um `page_blocks` por nó com valor original, rascunho e publicado;
5. mostram o documento real num iframe isolado e editável por clique;
6. materializam os valores publicados no HTML e removem todos os marcadores
   antes de responder em `/sites/{websiteId}/{path}`.

O HTML e CSS não são convertidos em componentes nem trocados por um template
Línea. Scripts do ZIP rodam dentro de sandbox para não herdarem a sessão da
aplicação. Sem ZIP, o construtor genérico continua disponível como fallback ao
criar a primeira página.

Cada publicación guarda un snapshot en `site_versions` y lo referencia desde
`site_change_log`, de modo que una versión anterior puede recuperarse como
borrador y revisarse antes de volver a publicar. EDITOR puede preparar y
recuperar borradores; VIEWER tiene acceso de lectura.

Para añadir un tipo de bloque, amplía `BlockType` en
`src/features/editor/types.ts`, añade sus valores iniciales en `blockDefaults`
y su composición visual en `src/components/site/page-block-renderer.tsx`.

La publicación programada utiliza el job privado `linea-site-publisher` de
Supabase `pg_cron`, que procesa la cola cada diez minutos. El endpoint
`/api/cron/publish-sites`, protegido por `CRON_SECRET`, queda disponible como
worker alternativo para otro programador externo.

## Segurança multi-tenant

As tabelas de dados de cliente carregam `organization_id`. As policies RLS usam `auth.uid()` e funções auxiliares para impedir acesso cruzado entre organizações. A aplicação também valida o membro no servidor antes de operações sensíveis.

Nunca use `SUPABASE_SERVICE_ROLE_KEY` no browser.

El esquema y las políticas de producción del proyecto `vozneizszafdokckotwv`
se auditaron el 12 de septiembre de 2026. La migración
`0002_production_rls_hardening.sql` separa las políticas CRUD, añade
`site_change_log` y refuerza la coherencia entre cada recurso y su
`organization_id`.

## Datos de demostración

La forma segura de probar la interfaz sin mezclar registros es arrancar con
`NEXT_PUBLIC_DEMO_MODE=true`. En ese modo el espacio aparece como
`DEMO · Clínica Dental Málaga Centro`, usa datos en memoria y bloquea todas
las mutaciones.

Si necesitas probar RLS con datos persistentes, crea un proyecto Supabase
separado, aplica las migraciones allí y ejecuta `supabase/seed.sql` solo en
ese proyecto. No uses el seed en producción ni conviertas una organización de
un cliente en espacio de pruebas.

## Integração com sites

O MVP inclui:
- `POST /api/public/leads`
- `POST /api/public/events`

A identificação do website usa `site_key`, e o endpoint valida `Origin` contra `websites.allowed_origin`. O preflight CORS usa `?siteKey=...`. Antes de alto volume, adicionar rate limiting no edge e manter rotação das chaves. Veja `docs/WEBSITE_INTEGRATION.md`.

## Estrutura

```text
src/
  app/
  components/
  features/
  lib/
supabase/
  migrations/
  seed.sql
tests/
```

## Próximo incremento

1. instalar dependências em um ambiente com acesso ao npm;
2. executar typecheck, lint, testes e build completos;
3. conectar um projeto Supabase real e aplicar a migration;
4. validar login, onboarding, troca de organização, leads, conteúdo, mídia e suporte com banco real;
5. adicionar rate limiting no edge para ingestão pública;
6. conectar GA4/Search Console;
7. implementar Stripe e feature flags comerciales más avanzadas.
