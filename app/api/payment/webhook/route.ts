import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { autoCommit } from '@/lib/gitAutoCommit';
import { sendWhatsAppNotification, formatOrderWhatsAppMessage } from '@/lib/whatsapp';

// Ensure this route is dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Allow GET for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook endpoint is active',
    endpoint: '/api/payment/webhook',
    timestamp: new Date().toISOString(),
    methods: ['GET', 'POST']
  });
}

export async function POST(request: NextRequest) {
  try {
    let data;
    try {
      data = await request.json();
    } catch (error) {
      // If JSON parsing fails, try to get data from query params (for testing)
      const url = new URL(request.url);
      const test = url.searchParams.get('test');
      if (test === 'true') {
        return NextResponse.json({ 
          status: 'ok', 
          message: 'Webhook endpoint is active (test mode)',
          timestamp: new Date().toISOString()
        });
      }
      // Return success even if JSON parsing fails (Mercado Pago might send empty body in tests)
      return NextResponse.json({ received: true, note: 'Empty or invalid JSON body' });
    }
    
    // Log received notification for debugging
    console.log('Webhook received:', { type: data.type, dataId: data.data?.id || data.data_id });
    
    // Mercado Pago sends different types of notifications
    const type = data.type;
    const dataId = data.data?.id || data.data_id;

    // Always return success for webhook test notifications
    if (!dataId || dataId === '123456' || dataId === '123') {
      console.log('Test notification received, returning success');
      return NextResponse.json({ received: true, note: 'Test notification processed' });
    }

    if ((type === 'payment' || type === 'merchant_order') && dataId) {
      // Fetch payment details from Mercado Pago
      const config = db.config.get();
      if (!config?.mercadoPagoAccessToken) {
        return NextResponse.json({ error: 'Mercado Pago not configured' }, { status: 500 });
      }

      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: {
          'Authorization': `Bearer ${config.mercadoPagoAccessToken}`,
        },
      });

      if (!paymentResponse.ok) {
        console.error('Failed to fetch payment details from Mercado Pago');
        return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
      }

      const payment = await paymentResponse.json();
      
      // Find order by external_reference or payment ID
      const orderId = payment.external_reference;
      let order = orderId ? db.orders.getById(orderId) : null;
      
      if (!order) {
        order = db.orders.getByPaymentId(dataId);
      }

      if (!order) {
        console.log('Order not found for payment:', dataId, '- This may be a test notification');
        // Return success even if order not found (might be a test or payment not yet linked to order)
        return NextResponse.json({ 
          received: true, 
          note: 'Order not found - payment may not be linked to an order yet' 
        });
      }

      // Update order payment status
      const paymentStatus = mapMercadoPagoStatus(payment.status);
      
      const updatedOrder = db.orders.update(order.id, {
        mercadoPagoPaymentId: dataId.toString(),
        paymentId: payment.id?.toString(),
        paymentStatus: paymentStatus,
        status: paymentStatus === 'approved' ? 'confirmed' : order.status,
        updatedAt: new Date().toISOString(),
      });

      if (!updatedOrder) {
        console.error('Failed to update order:', order.id);
        return NextResponse.json({ received: true, error: 'Failed to update order' });
      }

      // Auto-commit changes
      autoCommit(`Update order payment: ${updatedOrder.id}`, ['data/orders.json']).catch(console.error);

      // Send WhatsApp notification if payment is approved
      if (paymentStatus === 'approved') {
        const whatsappMessage = formatOrderWhatsAppMessage(updatedOrder);
        await sendWhatsAppNotification(whatsappMessage);
      }

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    // Return 200 even on error to prevent Mercado Pago from retrying invalid requests
    return NextResponse.json({ 
      received: true, 
      error: error?.message || 'Webhook processing failed' 
    }, { status: 200 });
  }
}

function mapMercadoPagoStatus(status: string): 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' {
  switch (status) {
    case 'approved':
      return 'approved';
    case 'rejected':
    case 'cancelled':
      return 'rejected';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    case 'pending':
    case 'in_process':
    case 'in_mediation':
      return 'pending';
    default:
      return 'pending';
  }
}
