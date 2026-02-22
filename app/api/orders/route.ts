import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { Order } from '@/lib/types';
import { autoCommit } from '@/lib/gitAutoCommit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    
    let orders: Order[];
    
    if (isPostgresAvailable()) {
      orders = await dbPostgres.orders.getAll();
    } else {
      orders = db.orders.getAll();
    }
    
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    
    if (paymentStatus) {
      orders = orders.filter(o => o.paymentStatus === paymentStatus);
    }
    
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch orders',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('=== INÍCIO: Criar Pedido ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Environment:', {
    VERCEL: !!process.env.VERCEL,
    NODE_ENV: process.env.NODE_ENV,
    hasPostgresUrl: !!process.env.POSTGRES_URL
  });
  
  try {
    const data = await request.json();
    
    console.log('Dados recebidos para criar pedido:', {
      hasCustomerName: !!data.customerName,
      hasCustomerEmail: !!data.customerEmail,
      hasCustomerPhone: !!data.customerPhone,
      hasAddress: !!data.address,
      hasItems: !!data.items,
      itemsCount: data.items?.length || 0,
      paymentMethod: data.paymentMethod
    });
    
    // Validate required fields
    if (!data.customerName) {
      return NextResponse.json({ 
        error: 'Nome do cliente é obrigatório',
        code: 'MISSING_CUSTOMER_NAME'
      }, { status: 400 });
    }
    
    if (!data.customerEmail) {
      return NextResponse.json({ 
        error: 'Email do cliente é obrigatório',
        code: 'MISSING_CUSTOMER_EMAIL'
      }, { status: 400 });
    }
    
    if (!data.customerPhone) {
      return NextResponse.json({ 
        error: 'Telefone do cliente é obrigatório',
        code: 'MISSING_CUSTOMER_PHONE'
      }, { status: 400 });
    }
    
    if (!data.address) {
      return NextResponse.json({ 
        error: 'Endereço é obrigatório',
        code: 'MISSING_ADDRESS'
      }, { status: 400 });
    }
    
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ 
        error: 'O pedido deve ter pelo menos um item',
        code: 'MISSING_ITEMS'
      }, { status: 400 });
    }
    
    if (!data.paymentMethod) {
      return NextResponse.json({ 
        error: 'Método de pagamento é obrigatório',
        code: 'MISSING_PAYMENT_METHOD'
      }, { status: 400 });
    }
    
    // Validate and parse numeric fields
    const subtotal = parseFloat(data.subtotal);
    const shippingFee = parseFloat(data.shippingFee);
    const total = parseFloat(data.total);
    
    if (isNaN(subtotal) || subtotal < 0) {
      return NextResponse.json({ 
        error: 'Subtotal inválido',
        code: 'INVALID_SUBTOTAL'
      }, { status: 400 });
    }
    
    if (isNaN(shippingFee) || shippingFee < 0) {
      return NextResponse.json({ 
        error: 'Taxa de frete inválida',
        code: 'INVALID_SHIPPING_FEE'
      }, { status: 400 });
    }
    
    if (isNaN(total) || total < 0) {
      return NextResponse.json({ 
        error: 'Total inválido',
        code: 'INVALID_TOTAL'
      }, { status: 400 });
    }
    
    // Validate items structure
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.productId || !item.productName || !item.productSku) {
        return NextResponse.json({ 
          error: `Item ${i + 1} está incompleto`,
          code: 'INVALID_ITEM'
        }, { status: 400 });
      }
      if (!item.quantity || item.quantity <= 0) {
        return NextResponse.json({ 
          error: `Quantidade inválida para o item ${i + 1}`,
          code: 'INVALID_ITEM_QUANTITY'
        }, { status: 400 });
      }
      if (!item.price || item.price <= 0) {
        return NextResponse.json({ 
          error: `Preço inválido para o item ${i + 1}`,
          code: 'INVALID_ITEM_PRICE'
        }, { status: 400 });
      }
    }
    
    const order: Order = {
      id: Date.now().toString(),
      customerName: data.customerName.trim(),
      customerEmail: data.customerEmail.trim(),
      customerPhone: data.customerPhone.trim(),
      customerCpf: data.customerCpf?.trim() || undefined,
      address: data.address,
      items: data.items,
      subtotal: subtotal,
      shippingFee: shippingFee,
      total: total,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'pending',
      notes: (data.notes || '').trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    let created: Order;
    
    // Check Postgres availability
    const isVercel = !!process.env.VERCEL;
    // Try multiple environment variable names
    const postgresUrl = process.env.POSTGRES_URL || 
                       process.env.DATABASE_URL || 
                       process.env.POSTGRES_CONNECTION_STRING ||
                       process.env.NEON_DATABASE_URL;
    const hasPostgresUrl = !!postgresUrl;
    const postgresAvailable = isPostgresAvailable();
    
    const envInfo = {
      isVercel: isVercel,
      postgresAvailable: postgresAvailable,
      hasPostgresUrl: hasPostgresUrl,
      nodeEnv: process.env.NODE_ENV,
      postgresUrlLength: postgresUrl?.length || 0,
      postgresUrlPrefix: postgresUrl ? postgresUrl.substring(0, 30) + '...' : 'não configurado',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('POSTGRES') || k.includes('DATABASE')).join(', ')
    };
    
    console.log('Ambiente:', envInfo);
    console.error('Ambiente (error log):', envInfo); // Force to error level to appear in logs
    
    // In Vercel, we MUST have Postgres configured
    if (isVercel && !hasPostgresUrl) {
      console.error('ERRO CRÍTICO: Vercel detectado mas POSTGRES_URL não encontrada!');
      console.error('Variáveis de ambiente disponíveis relacionadas:', envInfo.allEnvKeys);
      return NextResponse.json({ 
        error: 'Banco de dados não configurado',
        details: 'A aplicação requer um banco de dados Postgres na Vercel. A variável POSTGRES_URL não foi encontrada. Verifique se está configurada em Settings → Environment Variables.',
        code: 'DATABASE_NOT_CONFIGURED',
        debug: envInfo,
        instructions: [
          '1. Acesse o dashboard da Vercel',
          '2. Vá em Settings → Environment Variables',
          '3. Verifique se POSTGRES_URL existe',
          '4. Se não existir, adicione com a connection string do banco',
          '5. Certifique-se de marcar todas as environments (Production, Preview, Development)',
          '6. Faça um redeploy após adicionar a variável'
        ]
      }, { status: 500 });
    }
    
    if (postgresAvailable) {
      try {
        console.log('Criando pedido no Postgres...');
        console.log('Dados do pedido:', {
          id: order.id,
          customerName: order.customerName,
          itemsCount: order.items.length,
          total: order.total
        });
        created = await dbPostgres.orders.create(order);
        console.log('Pedido criado com sucesso no Postgres:', order.id);
      } catch (dbError: any) {
        console.error('Erro ao criar pedido no Postgres:', {
          message: dbError?.message,
          code: dbError?.code,
          detail: dbError?.detail,
          hint: dbError?.hint,
          name: dbError?.name,
          stack: dbError?.stack?.substring(0, 500)
        });
        
        // Check if it's a connection error
        const isConnectionError = dbError?.message?.includes('connect') || 
                                  dbError?.message?.includes('ECONNREFUSED') ||
                                  dbError?.code === 'ECONNREFUSED';
        
        // Check if it's a table/schema error
        const isSchemaError = dbError?.message?.includes('relation') || 
                             dbError?.message?.includes('does not exist') ||
                             dbError?.code === '42P01';
        
        let errorMessage = 'Erro ao criar pedido no banco de dados';
        let errorDetails = dbError?.message || 'Erro desconhecido';
        
        if (isConnectionError) {
          errorMessage = 'Erro de conexão com o banco de dados';
          errorDetails = 'Não foi possível conectar ao banco de dados Postgres. Verifique se a variável POSTGRES_URL está configurada corretamente.';
        } else if (isSchemaError) {
          errorMessage = 'Tabelas do banco de dados não encontradas';
          errorDetails = 'As tabelas do banco de dados não foram criadas. Execute o schema SQL (scripts/schema.sql) no SQL Editor da Vercel.';
        }
        
        return NextResponse.json({ 
          error: errorMessage,
          details: errorDetails,
          code: isConnectionError ? 'DATABASE_CONNECTION_ERROR' : 
                isSchemaError ? 'DATABASE_SCHEMA_ERROR' : 
                'DATABASE_ERROR',
          originalError: process.env.NODE_ENV === 'development' ? dbError?.message : undefined
        }, { status: 500 });
      }
    } else if (isVercel) {
      // In Vercel without Postgres, we can't write to filesystem
      console.error('ERRO: Vercel detectado mas POSTGRES_URL não configurada');
      return NextResponse.json({ 
        error: 'Banco de dados não configurado',
        details: 'A aplicação requer um banco de dados Postgres na Vercel. Configure a variável de ambiente POSTGRES_URL nas configurações do projeto na Vercel.',
        code: 'DATABASE_NOT_CONFIGURED',
        instructions: [
          '1. Acesse o dashboard da Vercel',
          '2. Vá em Settings → Environment Variables',
          '3. Adicione POSTGRES_URL com a connection string do banco',
          '4. Crie um banco Postgres em Storage → Create Database',
          '5. Execute o schema SQL (scripts/schema.sql) no SQL Editor'
        ]
      }, { status: 500 });
    } else {
      // Local development with JSON files
      try {
        console.log('Criando pedido em arquivo JSON...');
        created = db.orders.create(order);
        console.log('Pedido criado com sucesso:', order.id);
        // Auto-commit changes (only for JSON mode)
        autoCommit(`Create order: ${order.id}`, ['data/orders.json']).catch(console.error);
      } catch (fileError: any) {
        console.error('Erro ao criar pedido em arquivo:', fileError);
        return NextResponse.json({ 
          error: 'Erro ao salvar pedido',
          details: fileError?.message || 'Erro desconhecido',
          code: 'FILE_ERROR'
        }, { status: 500 });
      }
    }
    
    console.log('=== SUCESSO: Pedido criado ===', created.id);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('=== ERRO: Falha ao criar pedido ===');
    console.error('Tipo do erro:', error?.constructor?.name);
    console.error('Mensagem:', error?.message);
    console.error('Código:', error?.code);
    console.error('Stack:', error?.stack);
    console.error('Erro completo (JSON):', JSON.stringify({
      message: error?.message,
      code: error?.code,
      name: error?.name,
      stack: error?.stack?.substring(0, 1000)
    }, null, 2));
    
    const errorMessage = error?.message || 'Falha ao criar pedido';
    return NextResponse.json({ 
      error: errorMessage,
      details: error?.message || 'Erro desconhecido',
      code: 'UNKNOWN_ERROR',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}
