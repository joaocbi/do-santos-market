# Passo a Passo: Criar Token do Vercel Blob Storage

## 📋 Pré-requisitos
- Conta no Vercel (https://vercel.com)
- Acesso ao projeto "do-santos-market"

---

## 🚀 Passo a Passo Completo

### **Passo 1: Acessar o Dashboard da Vercel**
1. Abra seu navegador
2. Acesse: **https://vercel.com/dashboard**
3. Faça login na sua conta (se necessário)

---

### **Passo 2: Selecionar o Projeto**
1. Na lista de projetos, encontre e clique em **"do-santos-market"**
   - Se não encontrar, use a barra de busca no topo

---

### **Passo 3: Acessar Storage**
Você tem duas opções:

**Opção A - Via Menu Lateral:**
1. No menu lateral esquerdo, procure por **"Storage"**
2. Clique em **"Storage"**

**Opção B - Via Settings:**
1. Clique em **"Settings"** (Configurações) no topo
2. No menu lateral, clique em **"Storage"**

---

### **Passo 4: Criar Blob Store (se não existir)**
1. Se você ver uma lista vazia ou mensagem "No storage yet":
   - Clique no botão **"Create Database"** ou **"Add Storage"**
   - Selecione **"Blob"** na lista de opções
   - Clique em **"Create"** ou **"Continue"**
   - Aguarde a criação (pode levar alguns segundos)

2. Se já existe um Blob Store:
   - Clique no nome do Blob Store para abri-lo
   - Pule para o Passo 5

---

### **Passo 5: Acessar Configurações do Blob Store**
1. Com o Blob Store aberto, procure por:
   - **"Settings"** (Configurações) no menu
   - Ou um ícone de engrenagem ⚙️
   - Ou a aba **"Settings"** no topo

2. Clique em **"Settings"**

---

### **Passo 6: Acessar Tokens**
1. Dentro de Settings, procure por:
   - **"Tokens"** ou **"API Tokens"**
   - Ou **"Environment Variables"**
   - Ou uma seção sobre autenticação

2. Clique em **"Tokens"** ou **"API Tokens"**

---

### **Passo 7: Criar/Obter Token**

**Se já existe um token:**
1. Você verá uma lista de tokens
2. Procure por um token que tenha permissões de **"Read/Write"** ou **"Full Access"**
3. Clique no botão de **"Copy"** ou **"Show"** ao lado do token
4. **Copie o token completo** (começa com `vcp_`)

**Se não existe token ou precisa criar um novo:**
1. Clique no botão **"Create Token"** ou **"Generate Token"**
2. Dê um nome para o token (ex: "Image Migration Token")
3. Selecione as permissões:
   - ✅ **Read** (Leitura)
   - ✅ **Write** (Escrita)
   - Ou selecione **"Full Access"**
4. Clique em **"Create"** ou **"Generate"**
5. **IMPORTANTE:** Copie o token imediatamente! Ele só aparece uma vez
6. O token começa com `vcp_` seguido de uma longa string

---

### **Passo 8: Adicionar Token ao .env.local**
1. Abra o arquivo `.env.local` na raiz do projeto
2. Procure pela linha que começa com `BLOB_READ_WRITE_TOKEN=`
3. Se não existir, adicione uma nova linha no final do arquivo
4. Adicione/edite a linha com o formato:
   ```
   BLOB_READ_WRITE_TOKEN=vcp_seu_token_completo_aqui
   ```
5. **Importante:**
   - Sem espaços antes ou depois do `=`
   - Token completo na mesma linha
   - Sem quebras de linha no meio do token
   - Sem aspas (a menos que o token tenha espaços, o que é raro)
6. Salve o arquivo

---

### **Passo 9: Testar o Token**
1. Abra o terminal na pasta do projeto
2. Execute:
   ```bash
   node scripts/test-token.js
   ```
3. Se aparecer **"✅ VALID AND WORKING"**, o token está correto!
4. Se aparecer erro, verifique:
   - Se o token foi copiado completo
   - Se não há espaços extras
   - Se o Blob Store está ativo

---

### **Passo 10: Executar Migração**
Se o token estiver funcionando:
```bash
npm run migrate-images
```

---

## 🔍 Verificação Alternativa: Via Environment Variables

Se não encontrar Tokens no Blob Store, tente:

1. No projeto, vá em **Settings** → **Environment Variables**
2. Procure por `BLOB_READ_WRITE_TOKEN`
3. Se existir, clique para ver o valor
4. Copie o token
5. Se não existir, você pode adicionar manualmente:
   - Clique em **"Add New"**
   - Name: `BLOB_READ_WRITE_TOKEN`
   - Value: Cole o token que você obteve
   - Environments: Marque todas (Production, Preview, Development)
   - Clique em **"Save"**

---

## ⚠️ Troubleshooting

### "Não encontro Storage no menu"
- Certifique-se de que está no projeto correto
- Verifique se sua conta tem permissões de administrador
- Tente acessar via: `https://vercel.com/[seu-time]/[seu-projeto]/storage`

### "Não consigo criar Blob Store"
- Verifique se sua conta Vercel tem o plano que suporta Blob Storage
- Blob Storage está disponível em planos Hobby e superiores
- Verifique os limites da sua conta

### "Token não funciona mesmo após criar"
- Verifique se o Blob Store está ativo (não pausado)
- Certifique-se de que o token tem permissões de Read e Write
- Tente criar um novo token
- Verifique se está usando o token do projeto correto

### "Não consigo ver o token após criar"
- Tokens são mostrados apenas uma vez na criação
- Se perdeu, você precisa criar um novo
- Ou verifique em Environment Variables do projeto

---

## 📞 Ajuda Adicional

- **Documentação Vercel Blob:** https://vercel.com/docs/storage/vercel-blob
- **Suporte Vercel:** https://vercel.com/support
- **Comunidade:** https://github.com/vercel/vercel/discussions

---

## ✅ Checklist Final

Antes de executar a migração, certifique-se de que:
- [ ] Blob Store foi criado no Vercel
- [ ] Token foi criado/obtido
- [ ] Token foi adicionado ao `.env.local`
- [ ] Token foi testado com sucesso (`node scripts/test-token.js`)
- [ ] Token tem permissões de Read e Write

---

**Pronto!** Agora você pode executar a migração de imagens. 🚀
