import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const postgresAvailable = isPostgresAvailable();
    const config = postgresAvailable
      ? await dbPostgres.config.get()
      : db.config.get();

    const hasPublicKey = !!config.mercadoPagoPublicKey && config.mercadoPagoPublicKey.trim().length > 0;
    const hasAccessToken = !!config.mercadoPagoAccessToken && config.mercadoPagoAccessToken.trim().length > 0;

    return NextResponse.json({
      configured: hasPublicKey,
      hasPublicKey: hasPublicKey,
      hasAccessToken: hasAccessToken,
      publicKeyLength: config.mercadoPagoPublicKey?.length || 0,
      publicKeyPreview: config.mercadoPagoPublicKey 
        ? `${config.mercadoPagoPublicKey.substring(0, 20)}...` 
        : null,
      accessTokenLength: config.mercadoPagoAccessToken?.length || 0,
      isTestToken: config.mercadoPagoAccessToken?.includes('TEST') || false,
      message: hasPublicKey 
        ? 'Chave pública configurada. Bricks Builder pode ser usado.'
        : 'Chave pública não configurada. Configure no painel administrativo para usar Bricks Builder.',
      instructions: !hasPublicKey ? [
        '1. Acesse o painel administrativo',
        '2. Vá em Configurações → Mercado Pago',
        '3. Preencha o campo "Public Key"',
        '4. A chave pública começa com "APP_USR-"',
        '5. Encontre em: Credenciais → Public Key no painel do Mercado Pago'
      ] : []
    });
  } catch (error: any) {
    console.error('Erro ao verificar chave pública:', error);
    return NextResponse.json({ 
      configured: false,
      error: 'Erro ao verificar configuração',
      details: error?.message || 'Erro desconhecido'
    }, { status: 500 });
  }
}
