# ⚡ Setup Rápido - Postgres na Vercel

## 🎯 Passo a Passo Simplificado

### 1️⃣ Criar Banco de Dados (2 minutos)

1. Acesse: **https://vercel.com/dashboard**
2. Clique no projeto **"do-santos-market"**
3. No menu lateral: **Storage**
4. Clique: **Create Database**
5. Selecione: **Neon Postgres**
6. Clique: **Create**
7. **⚠️ COPIE A CONNECTION STRING** (aparece na tela)

### 2️⃣ Configurar Variável de Ambiente (1 minuto)

1. No mesmo projeto: **Settings** → **Environment Variables**
2. Clique: **Add New**
3. **Key:** `POSTGRES_URL`
4. **Value:** Cole a connection string copiada
5. **Environments:** Marque TODAS ✅
   - ✅ Production
   - ✅ Preview
   - ✅ Development
6. Clique: **Save**

### 3️⃣ Criar Tabelas (2 minutos)

1. No dashboard: **Storage** → Clique no banco criado
2. Clique: **SQL Editor**
3. Abra o arquivo: `scripts/schema.sql` (do projeto)
4. **Copie TODO** o conteúdo (Ctrl+A, Ctrl+C)
5. **Cole** no SQL Editor da Vercel
6. Clique: **Run** ou **Execute**
7. ✅ Deve aparecer mensagens de sucesso

### 4️⃣ Redeploy (1 minuto)

1. Vá em: **Deployments**
2. Clique nos **3 pontos** do último deploy
3. Clique: **Redeploy**
4. Aguarde concluir (~2 minutos)

### 5️⃣ Verificar (30 segundos)

Execute no terminal:
```bash
node scripts/check-postgres-config.js
```

Ou acesse no navegador:
```
https://seu-site.vercel.app/api/orders/diagnostic
```

Deve mostrar:
- ✅ `hasPostgresUrl: true`
- ✅ `postgresAvailable: true`
- ✅ `ordersTableExists: true`

## ✅ Pronto!

Agora você pode criar pedidos no site sem erro 500.

## 🆘 Problemas?

**Erro: "Banco de dados não configurado"**
- Verifique se `POSTGRES_URL` está em Settings → Environment Variables
- Certifique-se de marcar todas as environments
- Faça um redeploy após adicionar a variável

**Erro: "relation does not exist"**
- Execute o schema SQL (Passo 3)
- Verifique se todas as tabelas foram criadas

**Erro 500 ao criar pedido**
- Verifique os logs: Deployments → Seu deploy → Functions → Logs
- Teste o endpoint de diagnóstico
