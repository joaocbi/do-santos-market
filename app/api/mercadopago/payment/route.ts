import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { orderId } = data;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get order
    const order = isPostgresAvailable()
      ? await dbPostgres.orders.getById(orderId)
      : db.orders.getById(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get config
    const config = isPostgresAvailable()
      ? await dbPostgres.config.get()
      : db.config.get();

    if (!config?.mercadoPagoAccessToken) {
      return NextResponse.json({ error: 'Mercado Pago not configured' }, { status: 500 });
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000';

    // Prepare items for Mercado Pago
    const items = order.items.map(item => ({
      title: item.productName,
      description: `SKU: ${item.productSku}`,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    // Prepare payer info
    const payer = {
      name: order.customerName,
      email: order.customerEmail,
      phone: {
        area_code: order.customerPhone.replace(/\D/g, '').substring(0, 2) || '00',
        number: order.customerPhone.replace(/\D/g, '').substring(2) || '000000000',
      },
      identification: order.customerCpf ? {
        type: 'CPF',
        number: order.customerCpf.replace(/\D/g, ''),
      } : undefined,
    };

    // Create preference
    const preference = {
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
        installments: 12,
      },
      metadata: {
        order_id: order.id.toString(),
        customer_name: order.customerName,
        customer_email: order.customerEmail,
      },
    };

    // Create preference in Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.mercadoPagoAccessToken}`,
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      console.error('Mercado Pago preference creation failed:', errorData);
      return NextResponse.json({ 
        error: 'Failed to create payment preference',
        details: errorData 
      }, { status: 500 });
    }

    const result = await response.json();

    if (!result.init_point && !result.sandbox_init_point) {
      return NextResponse.json({ 
        error: 'No payment URL returned from Mercado Pago' 
      }, { status: 500 });
    }

    return NextResponse.json({
      init_point: result.init_point || result.sandbox_init_point,
      preference_id: result.id,
    });
  } catch (error: any) {
    console.error('Error creating Mercado Pago payment:', error);
    return NextResponse.json({ 
      error: 'Failed to create payment',
      details: error?.message 
    }, { status: 500 });
  }
}
