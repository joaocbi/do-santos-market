# ✅ Verificação de Configuração do Mercado Pago

## Status Atual

### ✅ Configuração no Banco de Dados
- **Access Token**: ✅ Configurado (74 caracteres)
- **Public Key**: ✅ Configurado (44 caracteres)
- **Token Type**: ✅ PRODUCTION
- **WhatsApp**: ✅ Configurado
- **Email**: ✅ Configurado

### 🌐 URLs Configuradas

**Base URL:** `https://www.dosantosmarket.com.br`

**URLs de Callback:**
- Success: `https://www.dosantosmarket.com.br/payment/success`
- Failure: `https://www.dosantosmarket.com.br/payment/failure`
- Pending: `https://www.dosantosmarket.com.br/payment/pending`

**Webhook:**
- URL: `https://www.dosantosmarket.com.br/api/payment/webhook`
- Status: ✅ Acessível e funcionando

## 📋 Checklist de Configuração

### 1. Variável de Ambiente na Vercel

Configure `NEXT_PUBLIC_BASE_URL` na Vercel:

1. Acesse: https://vercel.com/dashboard
2. Vá em **Settings** → **Environment Variables**
3. Adicione:
   - **Key:** `NEXT_PUBLIC_BASE_URL`
   - **Value:** `https://www.dosantosmarket.com.br`
   - **Environments:** Marque todas (Production, Preview, Development)
4. Clique em **Save**

### 2. Webhook no Mercado Pago

Configure o webhook no painel do Mercado Pago:

1. Acesse: https://www.mercadopago.com.br/developers
2. Faça login na sua conta
3. Vá em **"Suas integrações"** → **"Webhooks"**
4. Adicione o webhook:
   ```
   https://www.dosantosmarket.com.br/api/payment/webhook
   ```
5. Selecione os eventos:
   - ✅ Payment
   - ✅ Merchant Order
6. Salve a configuração

### 3. Aprovação do Domínio no Mercado Pago

Para produção, o domínio precisa estar aprovado:

1. No painel do Mercado Pago, vá em **"Configurações"** → **"Domínios"**
2. Adicione o domínio: `www.dosantosmarket.com.br`
3. Siga as instruções para verificação
4. Aguarde aprovação (pode levar algumas horas)

**Nota:** Para testes, você pode usar o domínio da Vercel temporariamente, mas para produção é necessário o domínio aprovado.

## 🧪 Testar Configuração

### Testar Webhook

Acesse no navegador:
```
https://www.dosantosmarket.com.br/api/payment/webhook?test=true
```

Deve retornar:
```json
{
  "status": "ok",
  "message": "Webhook endpoint is active (test mode)"
}
```

### Testar Criação de Pagamento

1. Acesse: `https://www.dosantosmarket.com.br/checkout`
2. Adicione produtos ao carrinho
3. Preencha os dados
4. Selecione **"Mercado Pago"** como método de pagamento
5. Clique em **"Finalizar Compra"**
6. Deve redirecionar para o checkout do Mercado Pago

## ⚠️ Problemas Comuns

### Erro: "Mercado Pago não está configurado"
- Verifique se as credenciais estão no banco de dados
- Execute: `node scripts/migrate-mercadopago-config.js`

### Erro: "Banco de dados não configurado"
- Verifique se `POSTGRES_URL` está configurada na Vercel
- Execute: `node scripts/update-vercel-postgres-url.js`
- Faça um redeploy

### Webhook não recebe notificações
- Verifique se o webhook está configurado no Mercado Pago
- Verifique se o domínio está aprovado
- Verifique os logs da Vercel: Dashboard → Deployments → Functions → Logs

### URLs de callback não funcionam
- Verifique se `NEXT_PUBLIC_BASE_URL` está configurada na Vercel
- Certifique-se de que o domínio está correto (com ou sem www)
- Faça um redeploy após configurar a variável

## 📝 Scripts Úteis

```bash
# Verificar configuração
node scripts/verify-mercadopago-config.js

# Migrar credenciais do JSON para o banco
node scripts/migrate-mercadopago-config.js

# Verificar variáveis na Vercel
vercel env ls
```

## ✅ Resumo

- ✅ Credenciais configuradas no banco de dados
- ✅ Webhook acessível e funcionando
- ⚠️  Configurar `NEXT_PUBLIC_BASE_URL` na Vercel (recomendado)
- ⚠️  Configurar webhook no painel do Mercado Pago
- ⚠️  Aprovar domínio no Mercado Pago (para produção)
