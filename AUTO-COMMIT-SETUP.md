# Configuração de Auto-Commit

O sistema foi configurado para fazer commit e push automático após operações no admin.

## Como Funciona

Quando você criar, editar ou excluir produtos (ou outras entidades) pelo admin:
1. A operação é salva no banco de dados
2. O sistema automaticamente tenta fazer commit e push das mudanças
3. O Vercel detecta o push e faz deploy automaticamente

## Configuração Necessária

### 1. Habilitar Auto-Commit

Adicione ao arquivo `.env.local`:

```env
ENABLE_AUTO_COMMIT=true
GIT_COMMIT_TOKEN=auto-commit-2024
```

### 2. Para Produção (Vercel)

No Vercel Dashboard, adicione as variáveis de ambiente:
- **ENABLE_AUTO_COMMIT**: `true`
- **GIT_COMMIT_TOKEN**: `auto-commit-2024` (ou um token mais seguro)

**IMPORTANTE:** No Vercel, o auto-commit funciona via GitHub API. Você precisa:

1. Criar um Personal Access Token no GitHub:
   - Vá em: https://github.com/settings/tokens
   - Clique em "Generate new token (classic)"
   - Dê permissões: `repo` (full control)
   - Copie o token

2. Adicionar ao Vercel:
   - Vá em Settings → Environment Variables
   - Adicione: `GITHUB_TOKEN` = seu token do GitHub
   - Marque todas as environments

### 3. Alternativa: Commit Manual

Se preferir fazer commit manualmente, você pode:
- Desabilitar o auto-commit (não definir `ENABLE_AUTO_COMMIT`)
- Fazer commit manualmente quando necessário:
  ```bash
  git add data/
  git commit -m "Update products"
  git push
  ```

## Arquivos Modificados

- `app/api/products/route.ts` - Auto-commit ao criar produto
- `app/api/products/[id]/route.ts` - Auto-commit ao editar/excluir produto
- `app/api/git/commit/route.ts` - API route para commit
- `lib/gitAutoCommit.ts` - Função helper

## Testando

1. Crie, edite ou exclua um produto pelo admin
2. Verifique os logs do servidor - deve aparecer "Auto-commit triggered"
3. Aguarde alguns segundos
4. Verifique o GitHub - deve ter um novo commit
5. O Vercel fará deploy automaticamente

## Troubleshooting

### Auto-commit não funciona
- Verifique se `ENABLE_AUTO_COMMIT=true` está configurado
- Verifique os logs do servidor para erros
- No Vercel, certifique-se de que `GITHUB_TOKEN` está configurado

### Erro de permissão
- Verifique se o token do GitHub tem permissões `repo`
- Verifique se o `GIT_COMMIT_TOKEN` está correto

### Commit funciona mas push não
- Verifique se o repositório está configurado corretamente
- Verifique se há credenciais git configuradas
