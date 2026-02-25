/**
 * Script para testar criação de pedido via API
 */

const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
let POSTGRES_URL = '';

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const lines = envFile.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('POSTGRES_URL=')) {
      POSTGRES_URL = line.substring('POSTGRES_URL='.length).trim();
      if ((POSTGRES_URL.startsWith('"') && POSTGRES_URL.endsWith('"')) || 
          (POSTGRES_URL.startsWith("'") && POSTGRES_URL.endsWith("'"))) {
        POSTGRES_URL = POSTGRES_URL.slice(1, -1);
      }
      POSTGRES_URL = POSTGRES_URL.replace(/[\r\n\t]/g, '').trim();
      break;
    }
  }
}

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não encontrada no .env.local');
  process.exit(1);
}

const { neon } = require('@neondatabase/serverless');

const cleanUrl = POSTGRES_URL
  .replace(/^["']|["']$/g, '')
  .replace(/[\r\n\t]/g, '')
  .trim();

const sql = neon(cleanUrl);

async function testOrderCreation() {
  console.log('🧪 Testando criação de pedido no banco...\n');

  const testOrder = {
    id: Date.now().toString(),
    customerName: 'Teste Cliente',
    customerEmail: 'teste@teste.com',
    customerPhone: '42999999999',
    customerCpf: null,
    address: {
      street: 'Rua Teste',
      number: '123',
      complement: '',
      neighborhood: 'Centro',
      city: 'Ponta Grossa',
      state: 'PR',
      zipCode: '84000000'
    },
    items: [
      {
        productId: '1',
        productName: 'Produto Teste',
        productSku: 'SKU001',
        quantity: 1,
        price: 10.00
      }
    ],
    subtotal: 10.00,
    shippingFee: 5.00,
    total: 15.00,
    paymentMethod: 'whatsapp',
    paymentStatus: 'pending',
    paymentId: null,
    mercadoPagoPaymentId: null,
    notes: null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    console.log('📝 Dados do pedido:');
    console.log(JSON.stringify(testOrder, null, 2));
    console.log('\n');

    // Convert to JSON strings for Postgres JSONB
    const addressJson = JSON.stringify(testOrder.address);
    const itemsJson = JSON.stringify(testOrder.items);

    console.log('💾 Inserindo pedido no banco...');
    
    await sql`
      INSERT INTO orders (id, customer_name, customer_email, customer_phone, customer_cpf,
                        address, items, subtotal, shipping_fee, total, payment_method,
                        payment_status, payment_id, mercado_pago_payment_id, notes, status, created_at, updated_at)
      VALUES (${testOrder.id}, ${testOrder.customerName}, ${testOrder.customerEmail}, ${testOrder.customerPhone}, 
              ${testOrder.customerCpf || null}, ${addressJson}::jsonb, ${itemsJson}::jsonb, 
              ${testOrder.subtotal}, ${testOrder.shippingFee}, ${testOrder.total}, ${testOrder.paymentMethod}, 
              ${testOrder.paymentStatus}, ${testOrder.paymentId || null}, ${testOrder.mercadoPagoPaymentId || null}, 
              ${testOrder.notes || null}, ${testOrder.status}, ${testOrder.createdAt}, ${testOrder.updatedAt})
    `;

    console.log('✅ Pedido criado com sucesso!');
    console.log(`   ID: ${testOrder.id}`);

    // Verify it was saved
    console.log('\n🔍 Verificando pedido salvo...');
    const saved = await sql`
      SELECT id, customer_name, customer_email, total, status
      FROM orders
      WHERE id = ${testOrder.id}
    `;

    if (saved && saved.length > 0) {
      console.log('✅ Pedido encontrado no banco:');
      console.log(JSON.stringify(saved[0], null, 2));
    } else {
      console.log('❌ Pedido não encontrado após inserção');
    }

    // Clean up
    console.log('\n🧹 Removendo pedido de teste...');
    await sql`DELETE FROM orders WHERE id = ${testOrder.id}`;
    console.log('✅ Pedido de teste removido');

    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao testar:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  }
}

testOrderCreation();
