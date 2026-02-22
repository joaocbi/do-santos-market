# 🗄️ Como Criar as Tabelas no Banco de Dados

## Método 1: Via API Route (Recomendado)

Após fazer o deploy, você pode criar as tabelas automaticamente:

1. **Certifique-se de que POSTGRES_URL está configurada na Vercel:**
   - Vercel Dashboard → Settings → Environment Variables
   - Verifique se `POSTGRES_URL` existe

2. **Acesse a API route:**
   ```
   https://dosantosmarket.com.br/api/setup-database
   ```
   
   Ou faça uma requisição POST:
   ```bash
   curl -X POST https://dosantosmarket.com.br/api/setup-database
   ```

3. **A API irá:**
   - Conectar ao banco de dados
   - Executar o schema SQL completo
   - Criar todas as tabelas necessárias
   - Retornar um resumo das tabelas criadas

## Método 2: Via SQL Editor da Vercel

1. Acesse: https://vercel.com/dashboard
2. Vá em **Storage** → Seu banco de dados
3. Clique em **SQL Editor**
4. Abra o arquivo `scripts/schema.sql` do projeto
5. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
6. Cole no SQL Editor da Vercel
7. Clique em **Run** ou **Execute**

## Método 3: Via Script Local

Se você tem a POSTGRES_URL configurada localmente:

```bash
node scripts/setup-postgres-direct.js
```

## Verificar se Funcionou

Após criar as tabelas, você pode verificar:

1. **Via SQL Editor:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

2. **Via API:**
   Acesse: `https://dosantosmarket.com.br/api/setup-database` (POST)
   Ela retornará a lista de tabelas criadas.

## Tabelas que Serão Criadas

- `categories` - Categorias de produtos
- `products` - Produtos
- `customers` - Clientes
- `payment_methods` - Métodos de pagamento
- `delivery_methods` - Métodos de entrega
- `banners` - Banners do site
- `links` - Links clicáveis
- `gallery_images` - Imagens da galeria
- `videos` - Vídeos
- `site_config` - Configurações do site
- `orders` - Pedidos

## ⚠️ Importante

- As tabelas são criadas com `CREATE TABLE IF NOT EXISTS`, então é seguro executar múltiplas vezes
- Certifique-se de que POSTGRES_URL está configurada antes de executar
- Após criar as tabelas, faça um teste criando um pedido no site
