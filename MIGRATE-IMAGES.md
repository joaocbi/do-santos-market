# Migração de Imagens para Vercel Blob Storage

Este guia explica como migrar todas as imagens locais para o Vercel Blob Storage.

## Pré-requisitos

1. **BLOB_READ_WRITE_TOKEN configurado**
   - Acesse o dashboard da Vercel: https://vercel.com/dashboard
   - Vá para o seu projeto
   - Settings → Environment Variables
   - Certifique-se de que `BLOB_READ_WRITE_TOKEN` está configurado

2. **Imagens na pasta `public/uploads/`**
   - As imagens devem existir localmente na pasta `public/uploads/`

## Como Executar

### Opção 1: Via NPM Script (Recomendado)

```bash
npm run migrate-images
```

### Opção 2: Diretamente com Node.js

```bash
node scripts/migrate-images-direct.js
```

### Opção 3: Com Token Temporário

Se o token não estiver nas variáveis de ambiente do sistema:

**Windows (PowerShell):**
```powershell
$env:BLOB_READ_WRITE_TOKEN="seu_token_aqui"
npm run migrate-images
```

**Linux/Mac:**
```bash
export BLOB_READ_WRITE_TOKEN="seu_token_aqui"
npm run migrate-images
```

## O que o Script Faz

1. **Lê todos os produtos** do arquivo `data/products.json`
2. **Identifica todas as imagens/vídeos** que começam com `/uploads/`
3. **Faz upload** de cada arquivo para o Vercel Blob Storage
4. **Cria um backup** do arquivo `products.json` original
5. **Atualiza o `products.json`** com as novas URLs do Vercel Blob Storage

## Resultado

Após a migração:
- ✅ Todas as imagens estarão no Vercel Blob Storage
- ✅ O arquivo `products.json` terá URLs do tipo: `https://[hash].public.blob.vercel-storage.com/...`
- ✅ Um backup será criado: `products.json.backup.[timestamp]`

## Próximos Passos

1. **Revisar** o arquivo `products.json` atualizado
2. **Commitar** as mudanças:
   ```bash
   git add data/products.json
   git commit -m "Migrate images to Vercel Blob Storage"
   ```
3. **Fazer push** para o repositório:
   ```bash
   git push
   ```
4. O Vercel fará deploy automaticamente e as imagens aparecerão no site

## Troubleshooting

### Erro: "BLOB_READ_WRITE_TOKEN not set"
- Configure a variável de ambiente antes de executar
- Ou adicione no arquivo `.env.local` (não commitar no git!)

### Erro: "File not found"
- Verifique se as imagens existem em `public/uploads/`
- Algumas imagens podem ter sido deletadas - isso é normal

### Erro: "Failed to upload"
- Verifique sua conexão com a internet
- Verifique se o token está correto
- Verifique os logs para mais detalhes

## Notas

- O script processa arquivos sequencialmente para evitar rate limiting
- Um pequeno delay (100ms) é adicionado entre uploads
- O script cria um backup automático antes de modificar `products.json`
- Imagens que já estão no Vercel Blob Storage (URLs completas) não são re-uploadadas
