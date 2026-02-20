import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const config = db.config.get();
    
    const checks = {
      hasAccessToken: !!config.mercadoPagoAccessToken,
      hasPublicKey: !!config.mercadoPagoPublicKey,
      accessTokenLength: config.mercadoPagoAccessToken?.length || 0,
      accessTokenPrefix: config.mercadoPagoAccessToken?.substring(0, 7) || 'none',
      isTestToken: config.mercadoPagoAccessToken?.includes('TEST') || false,
    };

    // Test if token is valid by making a simple API call
    let tokenValid = false;
    let tokenError = null;
    
    if (config.mercadoPagoAccessToken) {
      try {
        const testResponse = await fetch('https://api.mercadopago.com/users/me', {
          headers: {
            'Authorization': `Bearer ${config.mercadoPagoAccessToken}`,
          },
        });

        if (testResponse.ok) {
          const userData = await testResponse.json();
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

    return NextResponse.json({
      configured: checks.hasAccessToken,
      valid: tokenValid,
      checks,
      error: tokenError,
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.dosantosmarket.com.br'}/api/payment/webhook`,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to test configuration',
      details: error.message 
    }, { status: 500 });
  }
}
