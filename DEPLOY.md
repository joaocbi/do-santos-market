# Guia de Deploy na Vercel

## ⚠️ IMPORTANTE: Limitações Atuais

Este projeto atualmente usa:
- **Arquivos JSON locais** para armazenar dados (`data/*.json`)
- **Sistema de arquivos local** para uploads (`public/uploads/`)

**Isso NÃO funciona na Vercel** porque:
- A Vercel usa serverless functions (stateless)
- O sistema de arquivos é read-only em runtime
- Arquivos escritos não persistem entre requisições

**Nota**: O site pode ser deployado, mas as funcionalidades de admin (criar/editar/excluir) não funcionarão até migrar para um banco de dados e storage externo.

## Soluções Necessárias

### 1. Banco de Dados
Você precisa migrar para um banco de dados real:
- **Vercel Postgres** (recomendado - integrado)
- **MongoDB Atlas** (gratuito)
- **Supabase** (PostgreSQL gratuito)
- **PlanetScale** (MySQL serverless)

### 2. Armazenamento de Arquivos
Você precisa usar um serviço de armazenamento:
- **Vercel Blob Storage** (recomendado - integrado)
- **Cloudinary** (gratuito até certo limite)
- **AWS S3** + CloudFront
- **Uploadthing** (específico para Next.js)

## Deploy Básico

### Opção 1: Via Interface Web (Recomendado)

1. **Inicializar Git (se ainda não tiver)**
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Criar repositório no GitHub**
   - Acesse [github.com](https://github.com)
   - Crie um novo repositório
   - Siga as instruções para fazer push do código

3. **Deploy na Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com GitHub
   - Clique em "Add New Project"
   - Importe seu repositório
   - A Vercel detecta automaticamente Next.js
   - Clique em "Deploy"

### Opção 2: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy (na raiz do projeto)
vercel

# Deploy de produção
vercel --prod
```

### Passo 3: Variáveis de Ambiente (se necessário)
Se você adicionar variáveis de ambiente no futuro, configure em:
**Settings → Environment Variables**

## Próximos Passos Recomendados

1. **Migrar para Vercel Postgres** para dados
2. **Usar Vercel Blob Storage** para uploads
3. **Atualizar `lib/db.ts`** para usar o banco de dados
4. **Atualizar `app/api/upload/route.ts`** para usar blob storage

## Comandos Úteis

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy via CLI
vercel

# Deploy de produção
vercel --prod

# Ver logs
vercel logs
```

## Suporte

- [Documentação Vercel](https://vercel.com/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
