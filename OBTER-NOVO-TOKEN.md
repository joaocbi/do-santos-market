# Como Obter um Novo Token do Vercel Blob Storage

O token atual não está funcionando. Siga estes passos para obter um novo:

## Método 1: Via Dashboard da Vercel (Recomendado)

### Passo 1: Acesse o Dashboard
1. Vá para: https://vercel.com/dashboard
2. Faça login na sua conta

### Passo 2: Acesse Storage
1. Selecione seu projeto "Do Santos Market"
2. No menu lateral, clique em **Storage**
3. Ou vá em **Settings** → **Storage**

### Passo 3: Verifique/Crie Blob Store
1. Se já existe um Blob Store, clique nele
2. Se não existe:
   - Clique em **Create Database** ou **Add Storage**
   - Selecione **Blob**
   - Clique em **Create**
   - Anote o nome do Blob Store

### Passo 4: Obtenha o Token
**Opção A - Via Environment Variables:**
1. Vá em **Settings** → **Environment Variables**
2. Procure por `BLOB_READ_WRITE_TOKEN`
3. Se existir, clique para ver o valor
4. Copie o token

**Opção B - Via Blob Store Settings:**
1. Na página do Blob Store, vá em **Settings**
2. Clique em **Tokens** ou **API Tokens**
3. Se não houver token, clique em **Create Token**
4. Copie o token gerado

### Passo 5: Adicione ao .env.local
1. Abra o arquivo `.env.local` na raiz do projeto
2. Adicione ou atualize a linha:
   ```
   BLOB_READ_WRITE_TOKEN=seu_novo_token_aqui
   ```
3. Salve o arquivo

### Passo 6: Teste o Token
```bash
node scripts/test-token.js
```

### Passo 7: Execute a Migração
```bash
npm run migrate-images
```

## Método 2: Via Vercel CLI

Se você tem a Vercel CLI instalada:

```bash
# Login na Vercel
vercel login

# Link ao projeto
vercel link

# Listar variáveis de ambiente
vercel env ls

# Ver o token
vercel env pull .env.local
```

## Verificar se o Token Está Funcionando

Após adicionar o token ao `.env.local`, teste com:

```bash
node scripts/test-token.js
```

Se aparecer "✅ VALID AND WORKING", o token está correto!

## Troubleshooting

### Token não aparece nas Environment Variables
- Certifique-se de que o Blob Store foi criado
- Verifique se está no projeto correto
- Tente criar um novo token via Blob Store Settings

### Token ainda não funciona
- Verifique se copiou o token completo (sem espaços)
- Certifique-se de que o `.env.local` está na raiz do projeto
- Reinicie o terminal após adicionar o token

### Precisa de ajuda?
- Documentação: https://vercel.com/docs/storage/vercel-blob
- Suporte: https://vercel.com/support
