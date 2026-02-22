import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dbPostgres, isPostgresAvailable } from '@/lib/db-postgres';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting complete payment test...');

    // Step 1: Get config
    const config = db.config.get();
    
    if (!config.mercadoPagoAccessToken) {
      return NextResponse.json({
        success: false,
        error: 'Mercado Pago not configured',
        step: 'config'
      }, { status: 400 });
    }

    const checks: any = {
      hasAccessToken: !!config.mercadoPagoAccessToken,
      hasPublicKey: !!config.mercadoPagoPublicKey,
      accessTokenLength: config.mercadoPagoAccessToken?.length || 0,
      accessTokenPrefix: config.mercadoPagoAccessToken?.substring(0, 20) || 'none',
      isTestToken: config.mercadoPagoAccessToken?.includes('TEST') || false,
    };

    // Step 2: Test token validity
    let tokenValid = false;
    let tokenError = null;
    let userData = null;
    
    try {
      const testResponse = await fetch('https://api.mercadopago.com/users/me', {
        headers: {
          'Authorization': `Bearer ${config.mercadoPagoAccessToken}`,
        },
      });

      if (testResponse.ok) {
        userData = await testResponse.json();
        tokenValid = true;
        checks.userId = userData.id;
        checks.userEmail = userData.email;
      } else {
        const errorData = await testResponse.json();
        tokenError = errorData.message || 'Invalid token';
      }
    } catch (error: any) {
      tokenError = error.message;
    }

    if (!tokenValid) {
      return NextResponse.json({
        success: false,
        error: 'Token is invalid',
        tokenError,
        checks,
        step: 'token'
      }, { status: 400 });
    }

    // Step 3: Get a test order
    let testOrder = null;
    try {
      const postgresAvailable = isPostgresAvailable();
      
      if (postgresAvailable) {
        const sql = dbPostgres.getSql();
        const orders = await sql`
          SELECT o.*, 
            json_agg(
              json_build_object(
                'productName', oi.product_name,
                'productSku', oi.product_sku,
                'quantity', oi.quantity,
                'price', oi.price
              )
            ) as items
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          WHERE o.customer_email IS NOT NULL 
            AND o.customer_name IS NOT NULL
          GROUP BY o.id
          ORDER BY o.created_at DESC
          LIMIT 1
        `;
        
        if (orders.length > 0) {
          testOrder = orders[0];
        }
      } else {
        // Fallback to JSON database
        const orders = db.orders.getAll();
        if (orders.length > 0) {
          testOrder = orders[0];
        }
      }
    } catch (error: any) {
      console.error('Error getting test order:', error);
    }

    if (!testOrder) {
      return NextResponse.json({
        success: false,
        error: 'No test order found',
        checks,
        step: 'order'
      }, { status: 400 });
    }

    // Step 4: Test preference creation
    let preferenceResult = null;
    let preferenceError = null;
    
    try {
      // Map items
      const items = (testOrder.items || []).map((item: any) => ({
        title: (item.productName || item.product_name || 'Produto').substring(0, 256),
        description: `SKU: ${item.productSku || item.product_sku || 'N/A'}`,
        quantity: Math.max(1, Math.floor(item.quantity || 1)),
        unit_price: parseFloat(item.price || 0),
      }));

      if (items.length === 0 || items.some((item: any) => item.unit_price <= 0)) {
        throw new Error('Invalid items for preference');
      }

      // Build payer
      const payer: any = {
        name: testOrder.customer_name || testOrder.customerName,
        email: testOrder.customer_email || testOrder.customerEmail,
      };

      // Add phone if available
      if (testOrder.customer_phone || testOrder.customerPhone) {
        const phone = testOrder.customer_phone || testOrder.customerPhone;
        const cleanedPhone = phone.replace(/\D/g, '');
        let phoneDigits = cleanedPhone;
        if (phoneDigits.length > 11 && phoneDigits.startsWith('55')) {
          phoneDigits = phoneDigits.substring(2);
        }
        if (phoneDigits.length >= 10) {
          const areaCode = phoneDigits.substring(0, 2);
          const number = phoneDigits.substring(2);
          if (areaCode && number && number.length >= 8) {
            payer.phone = {
              area_code: areaCode,
              number: number
            };
          }
        }
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.dosantosmarket.com.br';
      const orderId = testOrder.id || testOrder.orderId;
      
      const preference = {
        items: items,
        payer: payer,
        back_urls: {
          success: `${baseUrl}/payment/success?order_id=${orderId}`,
          failure: `${baseUrl}/payment/failure?order_id=${orderId}`,
          pending: `${baseUrl}/payment/pending?order_id=${orderId}`,
        },
        auto_return: 'approved',
        external_reference: orderId.toString(),
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
          order_id: orderId.toString(),
          customer_name: payer.name,
          customer_email: payer.email
        }
      };

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
        throw new Error(JSON.stringify(errorData));
      }

      preferenceResult = await response.json();
      
      // Validate init_point
      if (!preferenceResult.init_point && !preferenceResult.sandbox_init_point) {
        throw new Error('Mercado Pago did not return init_point');
      }
    } catch (error: any) {
      preferenceError = error.message;
    }

    return NextResponse.json({
      success: !preferenceError,
      checks,
      tokenValid,
      userData,
      testOrder: testOrder ? {
        id: testOrder.id || testOrder.orderId,
        customerName: testOrder.customer_name || testOrder.customerName,
        customerEmail: testOrder.customer_email || testOrder.customerEmail,
        itemsCount: testOrder.items?.length || 0
      } : null,
      preference: preferenceResult ? {
        id: preferenceResult.id,
        hasInitPoint: !!preferenceResult.init_point,
        hasSandboxInitPoint: !!preferenceResult.sandbox_init_point,
        warnings: preferenceResult.warnings || []
      } : null,
      preferenceError,
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.dosantosmarket.com.br'}/api/payment/webhook`,
      recommendations: [
        checks.isTestToken ? '⚠️ Using TEST token - switch to PRODUCTION token for real payments' : '✅ Using PRODUCTION token',
        !preferenceResult ? '❌ Preference creation failed - check error details' : '✅ Preference creation works',
        !preferenceResult?.init_point && !preferenceResult?.sandbox_init_point ? '❌ No init_point returned - button will not work' : '✅ Init point available - button should work'
      ]
    });
  } catch (error: any) {
    console.error('Complete test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}
