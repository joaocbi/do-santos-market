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
          preferenceId: mercadoPagoResponse.id, // ID da preferência para usar no Bricks
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
  
  // Adiciona telefone apenas se for válido
  if (payerPhone) {
    payer.phone = payerPhone;
  }

  // Calcula o total para garantir que corresponde
  const totalAmount = items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0);
  
  // Valida o valor total
  if (totalAmount <= 0) {
    throw new Error('O valor total do pedido deve ser maior que zero');
  }
  
  // Valida se o total corresponde ao total do pedido (com pequena tolerância para arredondamento)
  const totalDifference = Math.abs(totalAmount - order.total);
  if (totalDifference > 0.01) {
    console.warn(`Diferença entre total calculado (${totalAmount}) e total do pedido (${order.total}): ${totalDifference}`);
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.dosantosmarket.com.br';
  
  // Garante que todos os campos obrigatórios estão presentes para o botão funcionar
  // Seguindo a documentação da API do Mercado Pago para preferências
  const preference: any = {
    items: items,
    payer: payer,
    back_urls: {
      success: `${baseUrl}/payment/success?order_id=${order.id}`,
      failure: `${baseUrl}/payment/failure?order_id=${order.id}`,
      pending: `${baseUrl}/payment/pending?order_id=${order.id}`,
    },
    auto_return: 'approved',
    external_reference: order.id.toString(),
    notification_url: `${baseUrl}/api/payment/webhook`,
    statement_descriptor: 'Do Santos Market',
    expires: false,
    binary_mode: false,
    payment_methods: {
      excluded_payment_methods: [],
      excluded_payment_types: [],
      installments: 12
    },
    metadata: {
      order_id: order.id.toString(),
      customer_name: order.customerName,
      customer_email: order.customerEmail
    },
    // ID do site para Brasil (MLB)
    site_id: 'MLB'
  };
  
  // Valida a estrutura da preferência antes de enviar
  if (!preference.items || preference.items.length === 0) {
    throw new Error('A preferência deve conter pelo menos um item');
  }
  
  if (!preference.payer || !preference.payer.name || !preference.payer.email) {
    throw new Error('Dados do pagador incompletos');
  }
  
  if (!preference.back_urls || !preference.back_urls.success) {
    throw new Error('URLs de retorno não configuradas');
  }
  
  console.log('Total calculado:', totalAmount);
  console.log('Total do pedido:', order.total);
  console.log('Itens na preferência:', items.length);
  console.log('Preferência completa:', JSON.stringify(preference, null, 2));

  // Faz requisição para a API do Mercado Pago
  const apiUrl = 'https://api.mercadopago.com/checkout/preferences';
  console.log('Enviando requisição para Mercado Pago:', {
    url: apiUrl,
    method: 'POST',
    itemsCount: preference.items.length,
    payerEmail: preference.payer.email,
    totalAmount: totalAmount
  });
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Idempotency-Key': `order-${order.id}-${Date.now()}`, // Previne requisições duplicadas
    },
    body: JSON.stringify(preference),
  });
  
  console.log('Resposta do Mercado Pago recebida:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries())
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
      error: errorData,
      preferenceSent: JSON.stringify(preference, null, 2)
    });
    
    // Fornece mensagens de erro mais específicas baseadas no código de status
    let errorMessage = 'Falha ao criar preferência no Mercado Pago';
    
    if (response.status === 401) {
      errorMessage = 'Token de acesso do Mercado Pago inválido ou expirado. Verifique as credenciais.';
    } else if (response.status === 400) {
      errorMessage = errorData.message || errorData.cause?.[0]?.description || 'Dados inválidos na requisição ao Mercado Pago';
    } else if (response.status === 403) {
      errorMessage = 'Acesso negado pelo Mercado Pago. Verifique as permissões da conta.';
    } else if (response.status === 404) {
      errorMessage = 'Endpoint do Mercado Pago não encontrado. Verifique a URL da API.';
    } else if (response.status >= 500) {
      errorMessage = 'Erro no servidor do Mercado Pago. Tente novamente em alguns instantes.';
    } else if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.error) {
      errorMessage = errorData.error;
    }
    
    throw new Error(errorMessage);
  }

  const result = await response.json();
  console.log('Pagamento Mercado Pago criado com sucesso:', result.id);
  console.log('Resposta completa:', JSON.stringify(result, null, 2));
  
  // Valida a estrutura da resposta
  if (!result || typeof result !== 'object') {
    console.error('ERRO CRÍTICO: Resposta do Mercado Pago inválida');
    throw new Error('Resposta inválida do Mercado Pago. Tente novamente.');
  }
  
  // Valida se init_point está presente
  if (!result.init_point && !result.sandbox_init_point) {
    console.error('ERRO CRÍTICO: Mercado Pago não retornou init_point!');
    console.error('Resposta:', JSON.stringify(result, null, 2));
    
    // Verifica mensagens de erro específicas na resposta
    const errorMessage = result.message || result.error || 'Link de pagamento não disponível';
    throw new Error(`Mercado Pago não retornou o link de pagamento: ${errorMessage}`);
  }
  
  // Registra avisos se houver - podem indicar problemas que podem afetar o botão
  if (result.warnings && result.warnings.length > 0) {
    console.warn('Avisos do Mercado Pago:', JSON.stringify(result.warnings, null, 2));
    // Registra cada aviso separadamente para melhor depuração
    result.warnings.forEach((warning: any, index: number) => {
      console.warn(`Aviso ${index + 1}:`, warning);
    });
  }
  
  // Valida o ID da preferência
  if (!result.id) {
    console.error('ERRO: Mercado Pago não retornou ID da preferência');
    throw new Error('Resposta incompleta do Mercado Pago. Tente novamente.');
  }
  
  // Registra sucesso com todas as informações relevantes
  console.log('Preferência criada com sucesso:', {
    preferenceId: result.id,
    hasInitPoint: !!result.init_point,
    hasSandboxInitPoint: !!result.sandbox_init_point,
    warningsCount: result.warnings?.length || 0
  });
  
  return result;
}
