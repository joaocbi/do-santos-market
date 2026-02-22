import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dbPostgres, isPostgresAvailable } from '@/lib/db-postgres';

// Ensure this route is dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { orderId, paymentMethod } = data;

    if (!orderId) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório' }, { status: 400 });
    }

    // Check Postgres availability - same logic as orders route
    const isVercel = !!process.env.VERCEL;
    const hasPostgresUrl = !!process.env.POSTGRES_URL;
    const postgresAvailable = isPostgresAvailable();

    // In Vercel, we MUST have Postgres configured
    if (isVercel && !hasPostgresUrl) {
      console.error('ERRO CRÍTICO: Vercel detectado mas POSTGRES_URL não encontrada!');
      return NextResponse.json({ 
        error: 'Banco de dados não configurado',
        details: 'A aplicação requer um banco de dados Postgres na Vercel. A variável POSTGRES_URL não foi encontrada. Verifique se está configurada em Settings → Environment Variables.',
        code: 'DATABASE_NOT_CONFIGURED',
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

    // Get order from appropriate database
    let order;
    try {
      order = postgresAvailable
        ? await dbPostgres.orders.getById(orderId)
        : db.orders.getById(orderId);
    } catch (dbError: any) {
      console.error('Erro ao buscar pedido:', dbError);
      // Check if it's a database connection error
      if (dbError?.message?.includes('POSTGRES_URL') || dbError?.message?.includes('not configured')) {
        return NextResponse.json({ 
          error: 'Banco de dados não configurado',
          details: 'Erro ao conectar com o banco de dados. Verifique se POSTGRES_URL está configurada corretamente na Vercel.',
          code: 'DATABASE_NOT_CONFIGURED'
        }, { status: 500 });
      }
      throw dbError;
    }
    
    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Get config from appropriate database
    let config;
    try {
      config = postgresAvailable
        ? await dbPostgres.config.get()
        : db.config.get();
    } catch (dbError: any) {
      console.error('Erro ao buscar configuração:', dbError);
      // Check if it's a database connection error
      if (dbError?.message?.includes('POSTGRES_URL') || dbError?.message?.includes('not configured')) {
        return NextResponse.json({ 
          error: 'Banco de dados não configurado',
          details: 'Erro ao conectar com o banco de dados. Verifique se POSTGRES_URL está configurada corretamente na Vercel.',
          code: 'DATABASE_NOT_CONFIGURED'
        }, { status: 500 });
      }
      throw dbError;
    }
    
    // Check if Mercado Pago is configured
    if (paymentMethod === 'mercado_pago') {
      if (!config.mercadoPagoAccessToken) {
        return NextResponse.json({ 
          error: 'Mercado Pago não está configurado. Configure as credenciais no painel administrativo.',
          code: 'NOT_CONFIGURED'
        }, { status: 400 });
      }

      try {
        const mercadoPagoResponse = await createMercadoPagoPayment(order, config.mercadoPagoAccessToken);
        
        return NextResponse.json({
          paymentId: mercadoPagoResponse.id,
          initPoint: mercadoPagoResponse.init_point,
          sandboxInitPoint: mercadoPagoResponse.sandbox_init_point,
        });
      } catch (error: any) {
        console.error('Erro no Mercado Pago:', {
          message: error.message,
          stack: error.stack,
          orderId: orderId,
          order: order ? { id: order.id, itemsCount: order.items?.length } : null
        });
        return NextResponse.json({ 
          error: 'Falha ao criar pagamento no Mercado Pago',
          details: error.message,
          code: 'PAYMENT_CREATION_FAILED'
        }, { status: 500 });
      }
    }

    // For other payment methods
    return NextResponse.json({ 
      error: 'Método de pagamento não suportado' 
    }, { status: 400 });
  } catch (error: any) {
    console.error('Erro ao criar pagamento:', {
      message: error?.message,
      stack: error?.stack,
      error: error
    });
    return NextResponse.json({ 
      error: 'Falha ao criar pagamento',
      details: error?.message || 'Erro desconhecido'
    }, { status: 500 });
  }
}

async function createMercadoPagoPayment(order: any, accessToken: string) {
  console.log('Criando pagamento Mercado Pago para pedido:', order.id);
  console.log('Itens do pedido:', JSON.stringify(order.items, null, 2));
  
  // Validate required fields
  if (!order.customerName) {
    throw new Error('Nome do cliente é obrigatório');
  }
  
  if (!order.customerEmail) {
    throw new Error('Email do cliente é obrigatório');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(order.customerEmail)) {
    throw new Error('Email do cliente inválido');
  }
  
  // Validate order has items
  if (!order.items || order.items.length === 0) {
    throw new Error('O pedido deve ter pelo menos um item');
  }

  // Map items and ensure price is a number
  const items = order.items.map((item: any) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    if (isNaN(price) || price <= 0) {
      throw new Error(`Preço inválido para o item: ${item.productName || item.productSku || 'desconhecido'}`);
    }
    
    const quantity = Math.max(1, Math.floor(item.quantity || 1));
    if (quantity <= 0) {
      throw new Error(`Quantidade inválida para o item: ${item.productName || item.productSku || 'desconhecido'}`);
    }
    
    const productSku = item.productSku || item.sku || 'N/A';
    let productName = item.productName || item.name || `Produto ${productSku}`;
    
    // Mercado Pago has a limit of 256 characters for title
    if (productName.length > 256) {
      productName = productName.substring(0, 253) + '...';
    }
    
    return {
      title: productName,
      description: `SKU: ${productSku}`,
      quantity: quantity,
      unit_price: price,
    };
  });

  // Parse phone number properly
  let payerPhone: { area_code: string; number: string } | undefined = undefined;
  
  if (order.customerPhone) {
    // Remove all non-digit characters
    const cleanedPhone = order.customerPhone.replace(/\D/g, '');
    
    // Brazilian phone format: usually 10 or 11 digits (with or without country code)
    // Remove country code (55) if present
    let phoneDigits = cleanedPhone;
    if (phoneDigits.length > 11 && phoneDigits.startsWith('55')) {
      phoneDigits = phoneDigits.substring(2);
    }
    
    // Area code is typically 2 digits, number is 8-9 digits
    if (phoneDigits.length >= 10) {
      const areaCode = phoneDigits.substring(0, 2);
      const number = phoneDigits.substring(2);
      
      // Validate area code (Brazilian DDDs are 11-99)
      if (areaCode && number && number.length >= 8) {
        payerPhone = {
          area_code: areaCode,
          number: number
        };
      }
    }
  }

  console.log('Telefone parseado:', payerPhone ? `(${payerPhone.area_code}) ${payerPhone.number}` : 'não fornecido ou inválido');

  // Build payer object - phone is optional in Mercado Pago
  const payer: any = {
    name: order.customerName,
    email: order.customerEmail,
  };
  
  // Only add phone if it's valid
  if (payerPhone) {
    payer.phone = payerPhone;
  }

  const preference = {
    items: items,
    payer: payer,
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.dosantosmarket.com.br'}/payment/success?order_id=${order.id}`,
      failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.dosantosmarket.com.br'}/payment/failure?order_id=${order.id}`,
      pending: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.dosantosmarket.com.br'}/payment/pending?order_id=${order.id}`,
    },
    auto_return: 'approved',
    external_reference: order.id,
    notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.dosantosmarket.com.br'}/api/payment/webhook`,
  };

  console.log('Preferência Mercado Pago:', JSON.stringify(preference, null, 2));

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(preference),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
    }
    
    console.error('Erro na API do Mercado Pago:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    
    throw new Error(errorData.message || errorData.error || 'Falha ao criar preferência no Mercado Pago');
  }

  const result = await response.json();
  console.log('Pagamento Mercado Pago criado com sucesso:', result.id);
  return result;
}
