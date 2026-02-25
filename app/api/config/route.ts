import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    let config = isPostgresAvailable() 
      ? await dbPostgres.config.get()
      : db.config.get();
    
    // SEMPRE verifica o JSON e garante que a chave pública esteja disponível
    const configPath = path.join(process.cwd(), 'data', 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Se a chave pública não estiver no config mas estiver no JSON, usa do JSON
        if ((!config.mercadoPagoPublicKey || config.mercadoPagoPublicKey.trim().length === 0) &&
            jsonConfig.mercadoPagoPublicKey && jsonConfig.mercadoPagoPublicKey.trim().length > 0) {
          console.log('✅ Chave pública encontrada no JSON. Sincronizando...');
          
          if (isPostgresAvailable()) {
            // Sincroniza para o banco
            config = await dbPostgres.config.update({
              mercadoPagoPublicKey: jsonConfig.mercadoPagoPublicKey
            });
            console.log('✅ Chave pública sincronizada para o banco!');
          } else {
            // Atualiza no JSON
            config = db.config.update({
              mercadoPagoPublicKey: jsonConfig.mercadoPagoPublicKey
            });
            console.log('✅ Chave pública atualizada no JSON!');
          }
        }
        
        // Se ainda não tiver, força usar do JSON diretamente
        if (!config.mercadoPagoPublicKey || config.mercadoPagoPublicKey.trim().length === 0) {
          if (jsonConfig.mercadoPagoPublicKey && jsonConfig.mercadoPagoPublicKey.trim().length > 0) {
            console.log('⚠️ Forçando uso da chave pública do JSON diretamente');
            config.mercadoPagoPublicKey = jsonConfig.mercadoPagoPublicKey;
          }
        }
      } catch (jsonError: any) {
        console.error('❌ Erro ao ler JSON:', jsonError);
      }
    }
    
    
    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch config',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const updated = isPostgresAvailable()
      ? await dbPostgres.config.update(data)
      : db.config.update(data);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating config:', error);
    return NextResponse.json({ 
      error: 'Failed to update config',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}
