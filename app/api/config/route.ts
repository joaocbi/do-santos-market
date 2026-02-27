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
    const dataDir = path.join(process.cwd(), 'data');
    const configPath = path.join(dataDir, 'config.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Se a chave pública não estiver no config mas estiver no JSON, usa do JSON
        if (jsonConfig.mercadoPagoPublicKey && jsonConfig.mercadoPagoPublicKey.trim().length > 0 &&
            (!config.mercadoPagoPublicKey || config.mercadoPagoPublicKey.trim().length === 0)) {
          console.log('✅ Chave pública encontrada no JSON. Sincronizando...');
          
          if (isPostgresAvailable()) {
            // Sincroniza para o banco
            await dbPostgres.config.update({
              mercadoPagoPublicKey: jsonConfig.mercadoPagoPublicKey
            });
            config.mercadoPagoPublicKey = jsonConfig.mercadoPagoPublicKey;
            console.log('✅ Chave pública sincronizada para o banco!');
          } else {
            // Atualiza no JSON
            db.config.update({
              mercadoPagoPublicKey: jsonConfig.mercadoPagoPublicKey
            });
            config.mercadoPagoPublicKey = jsonConfig.mercadoPagoPublicKey;
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

        // Sincroniza companyName e companyLogo se estiverem no JSON e não no config atual
        if (jsonConfig.companyName && (!config.companyName || config.companyName.trim().length === 0)) {
          config.companyName = jsonConfig.companyName;
          if (isPostgresAvailable()) {
            await dbPostgres.config.update({ companyName: jsonConfig.companyName });
          } else {
            db.config.update({ companyName: jsonConfig.companyName });
          }
        }
        if (jsonConfig.companyLogo && (!config.companyLogo || config.companyLogo.trim().length === 0)) {
          config.companyLogo = jsonConfig.companyLogo;
          if (isPostgresAvailable()) {
            await dbPostgres.config.update({ companyLogo: jsonConfig.companyLogo });
          } else {
            db.config.update({ companyLogo: jsonConfig.companyLogo });
          }
        }

      } catch (jsonError: any) {
        console.error('❌ Erro ao ler JSON:', jsonError);
      }
    } else {
      // Se o JSON não existe, garante que o diretório exista para evitar erros futuros
      if (!fs.existsSync(dataDir)) {
        try {
          fs.mkdirSync(dataDir, { recursive: true });
        } catch (e) {}
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
