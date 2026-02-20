import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { orderId, paymentMethod } = data;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = db.orders.getById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const config = db.config.get();
    
    // If Mercado Pago is configured, create payment preference
    if (paymentMethod === 'mercado_pago' && config.mercadoPagoAccessToken) {
      try {
        const mercadoPagoResponse = await createMercadoPagoPayment(order, config.mercadoPagoAccessToken);
        
        return NextResponse.json({
          paymentId: mercadoPagoResponse.id,
          initPoint: mercadoPagoResponse.init_point,
          sandboxInitPoint: mercadoPagoResponse.sandbox_init_point,
        });
      } catch (error: any) {
        console.error('Mercado Pago error:', error);
        return NextResponse.json({ 
          error: 'Failed to create Mercado Pago payment',
          details: error.message 
        }, { status: 500 });
      }
    }

    // For other payment methods or if Mercado Pago is not configured
    return NextResponse.json({ 
      error: 'Payment method not supported or not configured' 
    }, { status: 400 });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

async function createMercadoPagoPayment(order: any, accessToken: string) {
  const items = order.items.map((item: any) => ({
    title: item.productName,
    description: `SKU: ${item.productSku}`,
    quantity: item.quantity,
    unit_price: item.price,
  }));

  const preference = {
    items: items,
    payer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: {
        area_code: order.customerPhone.substring(0, 2),
        number: order.customerPhone.substring(2).replace(/\D/g, ''),
      },
    },
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success?order_id=${order.id}`,
      failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/failure?order_id=${order.id}`,
      pending: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/pending?order_id=${order.id}`,
    },
    auto_return: 'approved',
    external_reference: order.id,
    notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment/webhook`,
  };

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(preference),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create Mercado Pago preference');
  }

  return await response.json();
}
