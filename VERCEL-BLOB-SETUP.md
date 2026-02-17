# Configuração do Vercel Blob Storage

## ✅ Código Atualizado

O código foi atualizado para usar Vercel Blob Storage. Agora você precisa configurar o Blob Storage na Vercel.

## Passo a Passo

### 1. Criar Blob Store na Vercel

1. Acesse o dashboard da Vercel: https://vercel.com/dashboard
2. Vá para o seu projeto `do-santos-market`
3. Clique em **Storage** no menu lateral
4. Clique em **Create Database** ou **Add Storage**
5. Selecione **Blob**
6. Clique em **Create**
7. Anote o nome do Blob Store (geralmente algo como `blob-xxxxx`)

### 2. Configurar Variável de Ambiente

1. No dashboard do projeto, vá em **Settings** → **Environment Variables**
2. Adicione a variável:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Será gerado automaticamente quando você criar o Blob Store
   - **Environments**: Marque todas (Production, Preview, Development)

**OU** use o token que aparece na página do Blob Store que você criou.

### 3. Obter o Token

O token `BLOB_READ_WRITE_TOKEN` é gerado automaticamente quando você cria o Blob Store. Você pode encontrá-lo:

- Na página do Blob Store em **Settings** → **Tokens**
- Ou será configurado automaticamente pela Vercel

### 4. Verificar Configuração

Após configurar, faça um novo deploy:

```bash
git add .
git commit -m "Migrate to Vercel Blob Storage"
git push
```

Ou faça deploy manual:
```bash
vercel --prod
```

## Como Funciona Agora

- **Uploads**: Todos os uploads vão para o Vercel Blob Storage
- **URLs**: As URLs retornadas serão do tipo `https://[hash].public.blob.vercel-storage.com/...`
- **Acesso**: Todas as imagens são públicas e acessíveis via URL
- **Persistência**: Os arquivos persistem entre deploys

## Testando

1. Acesse o admin do site: `/admin`
2. Tente fazer upload de uma imagem
3. Verifique se a URL retornada é do Vercel Blob Storage
4. Confirme que a imagem aparece corretamente

## Troubleshooting

### Erro: "BLOB_READ_WRITE_TOKEN is not defined"

- Verifique se a variável de ambiente está configurada
- Certifique-se de que está marcada para todos os ambientes
- Faça um novo deploy após adicionar a variável

### Imagens não aparecem

- Verifique se a URL é do Vercel Blob Storage
- Confirme que o `next.config.js` tem o hostname correto
- Verifique os logs do deploy na Vercel

## Documentação

- [Vercel Blob Storage Docs](https://vercel.com/docs/storage/vercel-blob)
- [@vercel/blob Package](https://www.npmjs.com/package/@vercel/blob)
