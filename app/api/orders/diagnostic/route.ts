import { NextRequest, NextResponse } from 'next/server';
import { isPostgresAvailable } from '@/lib/db-postgres';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('=== DIAGNÓSTICO: Verificando configuração ===');
  
  // Try multiple environment variable names
  const postgresUrl = process.env.POSTGRES_URL || 
                     process.env.URL_POSTGRES || 
                     process.env.DATABASE_URL || 
                     process.env.POSTGRES_CONNECTION_STRING ||
                     process.env.NEON_DATABASE_URL;
  
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasUrlPostgres: !!process.env.URL_POSTGRES,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      postgresUrlFound: !!postgresUrl,
      postgresUrlLength: postgresUrl?.length || 0,
      allEnvKeys: Object.keys(process.env).filter(k => 
        k.includes('POSTGRES') || k.includes('DATABASE') || k.includes('NEON') || k.includes('URL')
      ).join(', ') || 'nenhuma encontrada'
    },
    database: {
      postgresAvailable: isPostgresAvailable(),
      postgresUrlPrefix: postgresUrl ? postgresUrl.substring(0, 20) + '...' : 'não configurado',
    },
    test: {
      canCreateOrder: false,
      error: null as string | null,
    }
  };

  // Try to test database connection
  if (isPostgresAvailable() && postgresUrl) {
    try {
      // Clean connection string - remove quotes and line breaks
      const cleanUrl = postgresUrl
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/[\r\n\t]/g, '') // Remove line breaks and tabs
        .trim(); // Remove leading/trailing whitespace
      const sql = neon(cleanUrl);
      
      // Test query
      const result = await sql`SELECT 1 as test`;
      diagnostics.test.canCreateOrder = true;
      diagnostics.test.error = null;
      
      // Check if tables exist
      try {
        const tablesResult = await sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'orders'
        `;
        diagnostics.database.ordersTableExists = tablesResult.length > 0;
      } catch (tableError: any) {
        diagnostics.test.error = `Erro ao verificar tabelas: ${tableError?.message}`;
      }
    } catch (dbError: any) {
      diagnostics.test.canCreateOrder = false;
      diagnostics.test.error = dbError?.message || 'Erro desconhecido';
      console.error('Erro ao testar conexão:', dbError);
    }
  } else {
    diagnostics.test.error = 'POSTGRES_URL ou URL_POSTGRES não configurada';
    diagnostics.test.availableKeys = Object.keys(process.env).filter(k => 
      k.includes('POSTGRES') || k.includes('DATABASE') || k.includes('NEON')
    );
  }

  console.log('Diagnóstico completo:', JSON.stringify(diagnostics, null, 2));

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}
