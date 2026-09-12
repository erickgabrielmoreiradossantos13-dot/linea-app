# Deploy da Línea App no Vercel

## Opção mais rápida: testar agora em modo DEMO

A Línea App já está preparada para abrir em modo demo sem Supabase.

1. Descompacte o arquivo `linea-app-vercel-ready.zip`.
2. Abra `https://vercel.com/drop`.
3. Arraste a pasta `linea-app` inteira para a página.
4. Escolha sua conta/equipe e o nome do projeto.
5. Publique.

O Vercel deve detectar automaticamente que é um projeto Next.js.

### Variáveis para o primeiro teste

Nenhuma variável externa é obrigatória para o modo demo.

O código considera:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

por padrão.

Se quiser cadastrar explicitamente no Vercel:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

Depois do primeiro deploy, você pode também cadastrar:

```env
NEXT_PUBLIC_APP_URL=https://SEU-PROJETO.vercel.app
```

## Para usar com dados reais

Crie um projeto Supabase e aplique:

```text
supabase/migrations/0001_foundation.sql
```

Depois configure no Vercel, em Project Settings > Environment Variables:

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LINEA_INGESTION_PEPPER=
```

Não exponha `SUPABASE_SERVICE_ROLE_KEY` no navegador.

Stripe e Resend ainda pertencem a uma fase posterior e não são necessários para começar a testar o MVP.

## Recomendação

Primeiro publique em modo demo e valide navegação, UX e produto.
Depois conecte Supabase para testar autenticação, persistência, isolamento multi-tenant, leads, conteúdo, mídia e suporte com dados reais.
