import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Processando pagamento via Bricks:', {
      hasToken: !!body.token,
      hasTransactionAmount: !!body.transaction_amount,
      paymentMethodId: body.payment_method_id,
      installments: body.installments,
      orderId: body.external_reference
    });

    // Get config
    const postgresAvailable = isPostgresAvailable();
    const config = postgresAvailable
      ? await dbPostgres.config.get()
      : db.config.get();

    if (!config?.mercadoPagoAccessToken) {
      return NextResponse.json({ 
        error: 'Access Token do Mercado Pago não configurado',
        status: 'error'
      }, { status: 500 });
    }

    // Validação dos dados obrigatórios
    if (!body.token) {
      return NextResponse.json({ 
        error: 'Token de pagamento não fornecido',
        status: 'error'
      }, { status: 400 });
    }

    if (!body.transaction_amount) {
      return NextResponse.json({ 
        error: 'Valor da transação não fornecido',
        status: 'error'
      }, { status: 400 });
    }

    if (!body.payer || !body.payer.email) {
      return NextResponse.json({ 
        error: 'Dados do pagador não fornecidos',
        status: 'error'
      }, { status: 400 });
    }

    // Busca o pedido para obter informações adicionais
    const orderId = body.external_reference;
    let order = null;
    
    if (orderId) {
      try {
        order = postgresAvailable
          ? await dbPostgres.orders.getById(orderId)
          : db.orders.getById(orderId);
      } catch (error) {
        console.warn('Erro ao buscar pedido (continuando mesmo assim):', error);
      }
    }

    // Cria o cliente do Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: config.mercadoPagoAccessToken,
    });

    const payment = new Payment(client);

    // Prepara o corpo do pagamento
    const paymentBody: any = {
      transaction_amount: parseFloat(body.transaction_amount),
      token: body.token,
      description: order 
        ? `Pedido #${order.id} - ${order.items?.map((item: any) => item.productName || item.product_name).join(', ') || 'Produtos'}`
        : 'Compra no Do Santos Market',
      installments: body.installments ? parseInt(body.installments) : 1,
      payment_method_id: body.payment_method_id,
      payer: {
        email: body.payer.email,
      },
    };

    // Adiciona identificação do pagador se disponível
    if (body.payer.identification) {
      paymentBody.payer.identification = body.payer.identification;
    }

    // Adiciona external_reference se disponível
    if (orderId) {
      paymentBody.external_reference = orderId.toString();
    }

    // Adiciona metadata com informações do pedido
    if (order) {
      paymentBody.metadata = {
        order_id: order.id.toString(),
        customer_name: order.customerName || order.customer_name,
        customer_email: order.customerEmail || order.customer_email
      };
    }

    console.log('Criando pagamento no Mercado Pago:', {
      transaction_amount: paymentBody.transaction_amount,
      payment_method_id: paymentBody.payment_method_id,
      installments: paymentBody.installments,
      hasToken: !!paymentBody.token
    });

    // Cria o pagamento
    const result = await payment.create({ body: paymentBody });

    console.log('Pagamento criado com sucesso:', {
      id: result.id,
      status: result.status,
      status_detail: result.status_detail
    });

    // Atualiza o pedido com o status do pagamento
    if (orderId && order) {
      const paymentStatus = mapMercadoPagoStatus(result.status);
      
      try {
        if (postgresAvailable) {
          await dbPostgres.orders.update(orderId, {
            paymentStatus: paymentStatus,
            mercadoPagoPaymentId: result.id?.toString(),
            status: paymentStatus === 'approved' ? 'confirmed' : order.status
          });
        } else {
          db.orders.update(orderId, {
            paymentStatus: paymentStatus,
            mercadoPagoPaymentId: result.id?.toString(),
            status: paymentStatus === 'approved' ? 'confirmed' : order.status
          });
        }
      } catch (error) {
        console.error('Erro ao atualizar pedido (pagamento foi processado):', error);
      }
    }

    // Retorna resposta de sucesso
    const paymentStatus = mapMercadoPagoStatus(result.status);
    
    return NextResponse.json({
      status: paymentStatus,
      payment_id: result.id,
      order_id: orderId,
      redirect_url: paymentStatus === 'approved' 
        ? `/payment/success?order_id=${orderId || ''}`
        : paymentStatus === 'rejected'
        ? `/payment/failure?order_id=${orderId || ''}`
        : `/payment/pending?order_id=${orderId || ''}`,
      payment_result: {
        id: result.id,
        status: result.status,
        status_detail: result.status_detail
      }
    });

  } catch (error: any) {
    console.error('Erro ao processar pagamento:', {
      message: error?.message,
      stack: error?.stack,
      details: error?.cause || error
    });

    // Tenta extrair mensagem de erro mais específica
    let errorMessage = 'Erro ao processar pagamento';
    let errorDetails = error?.message || 'Erro desconhecido';

    if (error?.cause) {
      errorDetails = JSON.stringify(error.cause);
    } else if (error?.message) {
      errorDetails = error.message;
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails,
      status: 'error'
    }, { status: 500 });
  }
}

function mapMercadoPagoStatus(status: string): 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' {
  const statusMap: Record<string, 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'> = {
    'pending': 'pending',
    'approved': 'approved',
    'authorized': 'approved',
    'in_process': 'pending',
    'in_mediation': 'pending',
    'rejected': 'rejected',
    'cancelled': 'cancelled',
    'refunded': 'refunded',
    'charged_back': 'refunded'
  };
  
  return statusMap[status] || 'pending';
}
