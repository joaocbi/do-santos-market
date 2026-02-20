# 🗄️ Como Configurar Postgres na Vercel

Guia passo a passo para configurar o banco de dados Postgres no seu projeto.

## 📋 Passo 1: Criar o Banco de Dados

1. **Acesse o Dashboard da Vercel:**
   - Vá para: https://vercel.com/dashboard
   - Faça login na sua conta

2. **Selecione seu Projeto:**
   - Clique no projeto "do-santos-market" (ou o nome do seu projeto)

3. **Criar o Banco de Dados:**
   - No menu lateral, clique em **Storage**
   - Clique no botão **Create Database** (ou **Add Storage**)
   - Selecione **Neon Postgres** (ou apenas **Postgres**)
   - Clique em **Create**
   - ⚠️ **IMPORTANTE:** Anote a connection string que aparece! Ela será algo como:
     ```
     postgres://user:password@host.neon.tech/dbname?sslmode=require
     ```

## 📋 Passo 2: Configurar Variável de Ambiente

1. **No mesmo projeto, vá em Settings:**
   - Clique em **Settings** no menu superior
   - Clique em **Environment Variables** no menu lateral

2. **Adicionar POSTGRES_URL:**
   - Clique em **Add New**
   - **Key:** `POSTGRES_URL`
   - **Value:** Cole a connection string que você copiou no Passo 1
   - **Environments:** Marque TODAS as opções:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Clique em **Save**

## 📋 Passo 3: Criar as Tabelas (Schema)

**Método Recomendado: Via SQL Editor da Vercel/Neon**

1. No dashboard da Vercel, vá em **Storage**
2. Clique no banco de dados que você criou
3. Clique em **SQL Editor** (ou **Query**)
4. Abra o arquivo `scripts/schema.sql` do projeto no seu editor
5. Copie TODO o conteúdo do arquivo (Ctrl+A, Ctrl+C)
6. Cole no SQL Editor da Vercel
7. Clique em **Run** ou **Execute**
8. ✅ Você deve ver mensagens de sucesso para cada tabela criada

**Alternativa: Via psql (se preferir linha de comando)**

```bash
# Windows: Instale PostgreSQL do site oficial
# Mac: brew install postgresql  
# Linux: sudo apt-get install postgresql-client

# Executar schema
psql "sua-connection-string-aqui" -f scripts/schema.sql
```

## 📋 Passo 4: Migrar Dados Existentes (Opcional)

Se você já tem dados nos arquivos JSON e quer migrá-los:

```bash
# Windows PowerShell
$env:POSTGRES_URL="sua-connection-string-aqui"
node scripts/migrate-to-postgres.js
```

## 📋 Passo 5: Verificar se Funcionou

1. **No SQL Editor da Vercel/Neon, execute:**
   ```sql
   SELECT COUNT(*) FROM orders;
   SELECT COUNT(*) FROM products;
   SELECT * FROM site_config;
   ```

2. **Ou faça um novo deploy:**
   - A Vercel fará deploy automaticamente quando você fizer push
   - Ou vá em **Deployments** → Clique nos 3 pontos → **Redeploy**

3. **Teste criando um pedido:**
   - Acesse o site
   - Adicione produtos ao carrinho
   - Tente finalizar um pedido
   - Se funcionar sem erro 500, está configurado! ✅

## ✅ Checklist

- [ ] Banco de dados criado na Vercel
- [ ] Connection string copiada
- [ ] Variável `POSTGRES_URL` configurada nas Environment Variables
- [ ] Schema SQL executado (tabelas criadas)
- [ ] Dados migrados (se necessário)
- [ ] Novo deploy feito
- [ ] Teste de criação de pedido funcionando

## 🆘 Problemas Comuns

### Erro: "POSTGRES_URL is not defined"
- Verifique se a variável está configurada em Settings → Environment Variables
- Certifique-se de que marcou todas as environments (Production, Preview, Development)
- Faça um novo deploy após adicionar a variável

### Erro: "relation does not exist"
- Execute o schema SQL primeiro (Passo 3)
- Verifique se todas as tabelas foram criadas

### Erro 500 ao criar pedido
- Verifique se o POSTGRES_URL está correto
- Verifique se as tabelas foram criadas
- Veja os logs da Vercel em Deployments → Seu deploy → Functions → Logs

## 📞 Precisa de Ajuda?

- Verifique os logs da Vercel: Deployments → Seu deploy → Functions
- Veja a documentação: `MIGRATE-TO-POSTGRES.md`
- Documentação Neon: https://neon.tech/docs
