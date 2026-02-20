# 🎯 Próximos Passos - Configuração do Postgres

Você já tem o Neon instalado! Agora siga estes passos:

## 📋 Passo 1: Obter a Connection String

1. Na página do Neon que você está vendo, procure por:
   - **"Connection String"** ou **"Connection URL"**
   - Ou clique em **"Settings"** ou **"Configurações"**
   - Procure por uma string que comece com `postgres://` ou `postgresql://`

2. **Copie a connection string completa** - ela será algo como:
   ```
   postgres://user:password@host.neon.tech/dbname?sslmode=require
   ```

## 📋 Passo 2: Adicionar Variável de Ambiente

Execute este comando (substitua pela sua connection string):

```bash
node scripts/add-postgres-env.js "sua-connection-string-aqui"
```

**Ou manualmente via CLI:**
```bash
vercel env add POSTGRES_URL production
# Cole a connection string quando solicitado
# Repita para preview e development
```

## 📋 Passo 3: Executar Schema SQL

Você tem 2 opções:

### Opção A: Via SQL Editor da Vercel (Mais Fácil)

1. Na página do Neon, clique em **"SQL Editor"** ou **"Query"**
2. Abra o arquivo `scripts/schema.sql` do projeto
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **"Run"** ou **"Execute"**

### Opção B: Via Script Node.js

```bash
# Windows PowerShell
$env:POSTGRES_URL="sua-connection-string-aqui"
node scripts/setup-postgres.js
```

## 📋 Passo 4: Verificar se Funcionou

1. **Verifique as variáveis:**
   ```bash
   vercel env ls
   ```
   Deve mostrar `POSTGRES_URL` para Production, Preview e Development

2. **Teste criando um pedido:**
   - Acesse o site
   - Adicione produtos ao carrinho
   - Tente finalizar um pedido
   - Se não der erro 500, está funcionando! ✅

## ✅ Checklist

- [ ] Connection string copiada do Neon
- [ ] POSTGRES_URL adicionado às variáveis de ambiente
- [ ] Schema SQL executado (tabelas criadas)
- [ ] Novo deploy feito (automático após git push)
- [ ] Teste de criação de pedido funcionando

## 🆘 Problemas?

Se encontrar erros:

1. **Verifique os logs da Vercel:**
   - Deployments → Seu deploy → Functions → Logs

2. **Verifique se o schema foi executado:**
   - No SQL Editor, execute: `SELECT COUNT(*) FROM orders;`
   - Se der erro "relation does not exist", execute o schema novamente

3. **Verifique a connection string:**
   - Certifique-se de que está completa e correta
   - Deve começar com `postgres://` ou `postgresql://`

## 📞 Precisa de Ajuda?

- Veja o guia completo: `CONFIGURAR-POSTGRES.md`
- Documentação Neon: https://neon.tech/docs
