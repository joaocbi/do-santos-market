# Como Obter o BLOB_READ_WRITE_TOKEN

Para executar a migração de imagens, você precisa do token do Vercel Blob Storage.

## Passo a Passo

### 1. Acesse o Dashboard da Vercel
- Vá para: https://vercel.com/dashboard
- Faça login na sua conta

### 2. Selecione seu Projeto
- Clique no projeto "Do Santos Market" (ou o nome do seu projeto)

### 3. Acesse Storage
- No menu lateral, clique em **Storage**
- Ou vá em **Settings** → **Storage**

### 4. Crie ou Acesse o Blob Store
- Se já existe um Blob Store, clique nele
- Se não existe, clique em **Create Database** ou **Add Storage**
- Selecione **Blob**
- Clique em **Create**

### 5. Obtenha o Token
- Na página do Blob Store, vá em **Settings** → **Tokens**
- Ou procure por **BLOB_READ_WRITE_TOKEN** nas variáveis de ambiente do projeto
- Copie o token

### 6. Adicione ao .env.local
Crie ou edite o arquivo `.env.local` na raiz do projeto:

```
BLOB_READ_WRITE_TOKEN=seu_token_aqui
```

**IMPORTANTE:** Não commite este arquivo no Git! Ele já deve estar no `.gitignore`.

### 7. Execute a Migração
```bash
npm run migrate-images
```

## Alternativa: Via Variável de Ambiente

Se preferir não usar arquivo, configure diretamente:

**Windows PowerShell:**
```powershell
$env:BLOB_READ_WRITE_TOKEN="seu_token_aqui"
npm run migrate-images
```

**Windows CMD:**
```cmd
set BLOB_READ_WRITE_TOKEN=seu_token_aqui
npm run migrate-images
```

**Linux/Mac:**
```bash
export BLOB_READ_WRITE_TOKEN="seu_token_aqui"
npm run migrate-images
```

## Verificar se o Token Está Configurado

O token também pode estar configurado diretamente no Vercel:
- Vá em **Settings** → **Environment Variables**
- Procure por `BLOB_READ_WRITE_TOKEN`
- Se estiver lá, ele será usado automaticamente no deploy
- Mas para migração local, você precisa configurá-lo localmente
