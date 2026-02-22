import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dbPostgres, isPostgresAvailable } from '@/lib/db-postgres';

// Ensure this route is dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Use Postgres config if available, otherwise fallback to JSON
    const config = isPostgresAvailable() 
      ? await dbPostgres.config.get()
      : db.config.get();
    
    const checks: any = {
      hasAccessToken: !!config.mercadoPagoAccessToken,
      hasPublicKey: !!config.mercadoPagoPublicKey,
      accessTokenLength: config.mercadoPagoAccessToken?.length || 0,
      accessTokenPrefix: config.mercadoPagoAccessToken?.substring(0, 20) || 'none',
      isTestToken: config.mercadoPagoAccessToken?.includes('TEST') || false,
    };

    // Test if token is valid by making a simple API call
    let tokenValid = false;
    let tokenError = null;
    let userData = null;
    
    if (config.mercadoPagoAccessToken) {
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
    }

    // Test preference creation if token is valid
    let preferenceTest = null;
    let preferenceError = null;
    
    if (tokenValid && config.mercadoPagoAccessToken) {
      try {
        // Get a test order
        let testOrder = null;
        const postgresAvailable = isPostgresAvailable();
        
        if (postgresAvailable) {
          try {
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
          } catch (e) {
            console.error('Error getting test order from Postgres:', e);
          }
        }
        
        if (!testOrder) {
          const orders = db.orders.getAll();
          if (orders.length > 0) {
            testOrder = orders[0];
          }
        }

        if (testOrder) {
          // Create test preference
          const items = (testOrder.items || []).map((item: any) => ({
            title: (item.productName || item.product_name || 'Test Product').substring(0, 256),
            description: `SKU: ${item.productSku || item.product_sku || 'TEST'}`,
            quantity: Math.max(1, Math.floor(item.quantity || 1)),
            unit_price: parseFloat(item.price || 1),
          }));

          if (items.length > 0 && items.every((item: any) => item.unit_price > 0)) {
            const payer: any = {
              name: testOrder.customer_name || testOrder.customerName || 'Test User',
              email: testOrder.customer_email || testOrder.customerEmail || 'test@example.com',
            };

            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.dosantosmarket.com.br';
            const orderId = testOrder.id || testOrder.orderId || 'test';
            
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

            const prefResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.mercadoPagoAccessToken}`,
              },
              body: JSON.stringify(preference),
            });

            if (prefResponse.ok) {
              const prefResult = await prefResponse.json();
              preferenceTest = {
                id: prefResult.id,
                hasInitPoint: !!prefResult.init_point,
                hasSandboxInitPoint: !!prefResult.sandbox_init_point,
                warnings: prefResult.warnings || []
              };
            } else {
              const errorText = await prefResponse.text();
              try {
                const errorData = JSON.parse(errorText);
                preferenceError = JSON.stringify(errorData);
              } catch (e) {
                preferenceError = errorText;
              }
            }
          }
        }
      } catch (error: any) {
        preferenceError = error.message;
      }
    }

    return NextResponse.json({
      configured: checks.hasAccessToken,
      valid: tokenValid,
      checks,
      userData: userData ? {
        id: userData.id,
        email: userData.email
      } : null,
      error: tokenError,
      preferenceTest,
      preferenceError,
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.dosantosmarket.com.br'}/api/payment/webhook`,
      recommendations: [
        checks.isTestToken ? '⚠️ Using TEST token - switch to PRODUCTION for real payments' : '✅ Using PRODUCTION token',
        !preferenceTest ? '❌ Preference creation failed - check preferenceError' : '✅ Preference creation works',
        preferenceTest && !preferenceTest.hasInitPoint && !preferenceTest.hasSandboxInitPoint ? '❌ No init_point - button will not work' : preferenceTest ? '✅ Init point available - button should work' : null
      ].filter(Boolean)
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to test configuration',
      details: error.message 
    }, { status: 500 });
  }
}
