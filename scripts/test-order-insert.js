/**
 * Script para testar inserção de pedido no Postgres
 */

const { neon } = require('@neondatabase/serverless');

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não configurada');
  process.exit(1);
}

const sql = neon(POSTGRES_URL);

async function testOrderInsert() {
  console.log('🧪 Testando inserção de pedido...\n');

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

    // Teste 1: Inserção direta com objetos
    console.log('Teste 1: Inserção com objetos JavaScript...');
    try {
      await sql`
        INSERT INTO orders (id, customer_name, customer_email, customer_phone, customer_cpf,
                          address, items, subtotal, shipping_fee, total, payment_method,
                          payment_status, payment_id, mercado_pago_payment_id, notes, status, created_at, updated_at)
        VALUES (${testOrder.id}, ${testOrder.customerName}, ${testOrder.customerEmail}, ${testOrder.customerPhone},
                ${testOrder.customerCpf || null}, ${testOrder.address},
                ${testOrder.items}, ${testOrder.subtotal}, ${testOrder.shippingFee},
                ${testOrder.total}, ${testOrder.paymentMethod}, ${testOrder.paymentStatus},
                ${testOrder.paymentId || null}, ${testOrder.mercadoPagoPaymentId || null},
                ${testOrder.notes || null}, ${testOrder.status}, ${testOrder.createdAt}, ${testOrder.updatedAt})
      `;
      console.log('✅ Teste 1: Sucesso!\n');
      
      // Limpar
      await sql`DELETE FROM orders WHERE id = ${testOrder.id}`;
      console.log('🧹 Pedido de teste removido\n');
    } catch (error) {
      console.error('❌ Teste 1 falhou:', error.message);
      console.error('Detalhes:', error);
      console.log('\n');
    }

    // Teste 2: Inserção com JSON stringify
    console.log('Teste 2: Inserção com JSON.stringify...');
    try {
      const addressJson = JSON.stringify(testOrder.address);
      const itemsJson = JSON.stringify(testOrder.items);
      
      await sql.unsafe(`
        INSERT INTO orders (id, customer_name, customer_email, customer_phone, customer_cpf,
                          address, items, subtotal, shipping_fee, total, payment_method,
                          payment_status, payment_id, mercado_pago_payment_id, notes, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `, [
        testOrder.id + '_2',
        testOrder.customerName,
        testOrder.customerEmail,
        testOrder.customerPhone,
        testOrder.customerCpf || null,
        addressJson,
        itemsJson,
        testOrder.subtotal,
        testOrder.shippingFee,
        testOrder.total,
        testOrder.paymentMethod,
        testOrder.paymentStatus,
        testOrder.paymentId || null,
        testOrder.mercadoPagoPaymentId || null,
        testOrder.notes || null,
        testOrder.status,
        testOrder.createdAt,
        testOrder.updatedAt
      ]);
      console.log('✅ Teste 2: Sucesso!\n');
      
      // Limpar
      await sql`DELETE FROM orders WHERE id = ${testOrder.id + '_2'}`;
      console.log('🧹 Pedido de teste removido\n');
    } catch (error) {
      console.error('❌ Teste 2 falhou:', error.message);
      console.error('Detalhes:', error);
      console.log('\n');
    }

    // Verificar estrutura da tabela
    console.log('📊 Verificando estrutura da tabela orders...');
    try {
      const result = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'orders'
        ORDER BY ordinal_position
      `;
      console.log('Colunas da tabela orders:');
      result.forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } catch (error) {
      console.error('Erro ao verificar estrutura:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  }
}

testOrderInsert();
