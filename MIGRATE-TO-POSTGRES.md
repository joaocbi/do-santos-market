# Migração para Vercel Postgres / Neon

Este guia explica como migrar o projeto de arquivos JSON para Vercel Postgres (Neon).

## Pré-requisitos

1. **Criar banco de dados Neon na Vercel:**
   - Acesse o dashboard da Vercel: https://vercel.com/dashboard
   - Vá para o seu projeto
   - Clique em **Storage** → **Create Database**
   - Selecione **Neon Postgres** (ou **Postgres** se disponível)
   - Clique em **Create**
   - Anote a connection string que será gerada

2. **Configurar variável de ambiente:**
   - No dashboard do projeto, vá em **Settings** → **Environment Variables**
   - Adicione: `POSTGRES_URL` com a connection string do banco
   - Marque todas as environments (Production, Preview, Development)

## Passo 1: Criar Schema do Banco

1. Acesse o dashboard do Neon/Vercel Postgres
2. Vá em **SQL Editor** ou use uma ferramenta como DBeaver/psql
3. Execute o conteúdo do arquivo `scripts/schema.sql`

Ou via CLI:
```bash
# Instalar psql se necessário
# Windows: via PostgreSQL installer
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Conectar e executar schema
psql $POSTGRES_URL -f scripts/schema.sql
```

## Passo 2: Migrar Dados

Execute o script de migração:

```bash
# Configurar POSTGRES_URL localmente (apenas para migração)
export POSTGRES_URL="sua-connection-string-aqui"

# Executar migração
node scripts/migrate-to-postgres.js
```

**Windows PowerShell:**
```powershell
$env:POSTGRES_URL="sua-connection-string-aqui"
node scripts/migrate-to-postgres.js
```

## Passo 3: Verificar Migração

Após a migração, verifique se os dados foram migrados corretamente:

1. Acesse o SQL Editor no dashboard do Neon
2. Execute queries para verificar:
   ```sql
   SELECT COUNT(*) FROM products;
   SELECT COUNT(*) FROM categories;
   SELECT COUNT(*) FROM orders;
   SELECT * FROM site_config;
   ```

## Passo 4: Deploy

Após configurar a variável `POSTGRES_URL` na Vercel, faça um novo deploy:

```bash
git add .
git commit -m "Migrate to Postgres database"
git push
```

A Vercel fará o deploy automaticamente e o código detectará automaticamente que Postgres está disponível.

## Como Funciona

O código foi atualizado para:

1. **Detectar automaticamente** se Postgres está disponível (verificando `POSTGRES_URL`)
2. **Usar Postgres** quando disponível (produção na Vercel)
3. **Fallback para JSON** quando Postgres não está disponível (desenvolvimento local)

### APIs Atualizadas

- ✅ `/api/orders` - Criar e listar pedidos
- ✅ `/api/config` - Configurações do site
- ✅ `/api/payment/webhook` - Webhook do Mercado Pago

### APIs que ainda precisam ser atualizadas

- `/api/products` - Produtos
- `/api/categories` - Categorias
- Outras APIs de admin

## Troubleshooting

### Erro: "POSTGRES_URL is not defined"

Certifique-se de que a variável de ambiente está configurada na Vercel:
- Settings → Environment Variables → `POSTGRES_URL`

### Erro: "relation does not exist"

Execute o schema SQL primeiro:
```bash
psql $POSTGRES_URL -f scripts/schema.sql
```

### Dados não aparecem após migração

Verifique se a migração foi executada corretamente:
```sql
SELECT COUNT(*) FROM products;
```

Se retornar 0, execute novamente o script de migração.

## Próximos Passos

1. Atualizar todas as APIs para usar Postgres
2. Remover dependência de arquivos JSON (opcional)
3. Configurar backups automáticos no Neon

## Suporte

- [Documentação Neon](https://neon.tech/docs)
- [Documentação Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
