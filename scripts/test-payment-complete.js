/**
 * Complete test script for Mercado Pago payment
 * Tests token, preference creation, and button functionality
 */

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testComplete() {
  console.log('🔍 Starting complete payment test...\n');

  // Step 1: Get database connection
  let sql;
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.URL_POSTGRES || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('No database connection string found');
    }
    sql = neon(connectionString);
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }

  // Step 2: Get Mercado Pago config
  let config;
  try {
    const configResult = await sql`
      SELECT mercado_pago_access_token, mercado_pago_public_key 
      FROM site_config 
      LIMIT 1
    `;
    
    if (configResult.length === 0 || !configResult[0].mercado_pago_access_token) {
      throw new Error('Mercado Pago not configured in database');
    }
    
    config = {
      accessToken: configResult[0].mercado_pago_access_token,
      publicKey: configResult[0].mercado_pago_public_key
    };
    
    console.log('✅ Mercado Pago config found');
    console.log(`   Access Token: ${config.accessToken.substring(0, 20)}... (${config.accessToken.length} chars)`);
    console.log(`   Is Test Token: ${config.accessToken.includes('TEST')}`);
  } catch (error) {
    console.error('❌ Failed to get config:', error.message);
    return;
  }

  // Step 3: Test token validity
  console.log('\n📋 Testing token validity...');
  try {
    const tokenTest = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
      },
    });

    if (!tokenTest.ok) {
      const errorData = await tokenTest.json();
      throw new Error(`Token invalid: ${errorData.message || 'Unknown error'}`);
    }

    const userData = await tokenTest.json();
    console.log('✅ Token is valid');
    console.log(`   User ID: ${userData.id}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Is Test: ${config.accessToken.includes('TEST')}`);
    
    if (config.accessToken.includes('TEST')) {
      console.log('⚠️  WARNING: Using TEST token - button may not work in production!');
    }
  } catch (error) {
    console.error('❌ Token test failed:', error.message);
    return;
  }

  // Step 4: Get a test order
  console.log('\n📦 Getting test order...');
  let testOrder;
  try {
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

    if (orders.length === 0) {
      throw new Error('No orders found in database');
    }

    testOrder = orders[0];
    console.log('✅ Test order found');
    console.log(`   Order ID: ${testOrder.id}`);
    console.log(`   Customer: ${testOrder.customer_name}`);
    console.log(`   Email: ${testOrder.customer_email}`);
    console.log(`   Items: ${testOrder.items?.length || 0}`);
  } catch (error) {
    console.error('❌ Failed to get test order:', error.message);
    return;
  }

  // Step 5: Test preference creation
  console.log('\n💳 Testing preference creation...');
  try {
    // Map items
    const items = testOrder.items.map((item) => ({
      title: item.productName || 'Produto',
      description: `SKU: ${item.productSku || 'N/A'}`,
      quantity: parseInt(item.quantity) || 1,
      unit_price: parseFloat(item.price) || 0,
    }));

    // Build payer
    const payer = {
      name: testOrder.customer_name,
      email: testOrder.customer_email,
    };

    // Add phone if available
    if (testOrder.customer_phone) {
      const cleanedPhone = testOrder.customer_phone.replace(/\D/g, '');
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
    
    const preference = {
      items: items,
      payer: payer,
      back_urls: {
        success: `${baseUrl}/payment/success?order_id=${testOrder.id}`,
        failure: `${baseUrl}/payment/failure?order_id=${testOrder.id}`,
        pending: `${baseUrl}/payment/pending?order_id=${testOrder.id}`,
      },
      auto_return: 'approved',
      external_reference: testOrder.id.toString(),
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
        order_id: testOrder.id.toString(),
        customer_name: testOrder.customer_name,
        customer_email: testOrder.customer_email
      }
    };

    console.log('📤 Sending preference creation request...');
    console.log('   Items:', items.length);
    console.log('   Total:', items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0));

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.accessToken}`,
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
      
      console.error('❌ Preference creation failed:');
      console.error('   Status:', response.status);
      console.error('   Error:', JSON.stringify(errorData, null, 2));
      return;
    }

    const result = await response.json();
    console.log('✅ Preference created successfully!');
    console.log(`   Preference ID: ${result.id}`);
    console.log(`   Init Point: ${result.init_point}`);
    console.log(`   Sandbox Init Point: ${result.sandbox_init_point || 'N/A'}`);
    
    // Check if init_point is available
    if (!result.init_point && !result.sandbox_init_point) {
      console.error('❌ WARNING: No init_point returned! Button will not work!');
    } else {
      console.log('✅ Init point available - button should work!');
    }

    // Check for any warnings in the response
    if (result.warnings && result.warnings.length > 0) {
      console.log('⚠️  Warnings from Mercado Pago:');
      result.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.message || warning}`);
      });
    }

  } catch (error) {
    console.error('❌ Preference creation test failed:', error.message);
    console.error('   Stack:', error.stack);
    return;
  }

  console.log('\n✅ All tests completed!');
  console.log('\n📋 Summary:');
  console.log('   - Token: Valid');
  console.log('   - Config: Found');
  console.log('   - Order: Found');
  console.log('   - Preference: Created');
  console.log('\n💡 If button still does not work:');
  console.log('   1. Check if token is TEST (should be PRODUCTION)');
  console.log('   2. Check browser console for JavaScript errors');
  console.log('   3. Verify domain is approved in Mercado Pago dashboard');
  console.log('   4. Check Vercel logs for any errors');
}

testComplete().catch(console.error);
