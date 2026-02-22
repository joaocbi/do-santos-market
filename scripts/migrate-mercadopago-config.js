/**
 * Script para migrar configuração do Mercado Pago do JSON para o banco
 */

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
let POSTGRES_URL = '';

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const lines = envFile.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('POSTGRES_URL=')) {
      POSTGRES_URL = line.substring('POSTGRES_URL='.length).trim();
      if ((POSTGRES_URL.startsWith('"') && POSTGRES_URL.endsWith('"')) || 
          (POSTGRES_URL.startsWith("'") && POSTGRES_URL.endsWith("'"))) {
        POSTGRES_URL = POSTGRES_URL.slice(1, -1);
      }
      POSTGRES_URL = POSTGRES_URL.replace(/[\r\n\t]/g, '').trim();
    }
  }
}

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não encontrada no .env.local');
  process.exit(1);
}

// Read config.json
const configPath = path.join(process.cwd(), 'data', 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ Arquivo config.json não encontrado');
  process.exit(1);
}

const jsonConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const cleanUrl = POSTGRES_URL
  .replace(/^["']|["']$/g, '')
  .replace(/[\r\n\t]/g, '')
  .trim();

const sql = neon(cleanUrl);

(async () => {
  try {
    console.log('📝 Migrando configuração do Mercado Pago para o banco...\n');

    // Get current config from database
    const currentConfig = await sql`
      SELECT whatsapp_number as "whatsappNumber", email, social_media as "socialMedia",
             mercado_pago_access_token as "mercadoPagoAccessToken",
             mercado_pago_public_key as "mercadoPagoPublicKey"
      FROM site_config
      WHERE id = 'config'
      LIMIT 1
    `;

    let configToUpdate = {};
    
    if (currentConfig.length === 0) {
      console.log('⚠️  Configuração não existe no banco, criando...');
      // Create new config
      configToUpdate = {
        whatsappNumber: jsonConfig.whatsappNumber || '',
        email: jsonConfig.email || '',
        socialMedia: jsonConfig.socialMedia || {},
        mercadoPagoAccessToken: jsonConfig.mercadoPagoAccessToken || '',
        mercadoPagoPublicKey: jsonConfig.mercadoPagoPublicKey || '',
      };
      
      await sql`
        INSERT INTO site_config (id, whatsapp_number, email, social_media, mercado_pago_access_token, mercado_pago_public_key)
        VALUES ('config', ${configToUpdate.whatsappNumber}, ${configToUpdate.email}, 
                ${JSON.stringify(configToUpdate.socialMedia)}::jsonb, 
                ${configToUpdate.mercadoPagoAccessToken}, ${configToUpdate.mercadoPagoPublicKey})
      `;
    } else {
      console.log('✅ Configuração existe no banco, atualizando...');
      // Update existing config, preserving existing values if JSON is empty
      const current = currentConfig[0];
      configToUpdate = {
        whatsappNumber: jsonConfig.whatsappNumber || current.whatsappNumber || '',
        email: jsonConfig.email || current.email || '',
        socialMedia: jsonConfig.socialMedia || current.socialMedia || {},
        mercadoPagoAccessToken: jsonConfig.mercadoPagoAccessToken || current.mercadoPagoAccessToken || '',
        mercadoPagoPublicKey: jsonConfig.mercadoPagoPublicKey || current.mercadoPagoPublicKey || '',
      };
      
      await sql`
        UPDATE site_config
        SET whatsapp_number = ${configToUpdate.whatsappNumber},
            email = ${configToUpdate.email},
            social_media = ${JSON.stringify(configToUpdate.socialMedia)}::jsonb,
            mercado_pago_access_token = ${configToUpdate.mercadoPagoAccessToken},
            mercado_pago_public_key = ${configToUpdate.mercadoPagoPublicKey},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 'config'
      `;
    }

    console.log('\n✅ Configuração migrada com sucesso!\n');
    console.log('📋 Configuração atualizada:');
    console.log(`   WhatsApp: ${configToUpdate.whatsappNumber || 'Não configurado'}`);
    console.log(`   Email: ${configToUpdate.email || 'Não configurado'}`);
    console.log(`   Access Token: ${configToUpdate.mercadoPagoAccessToken ? '✅ Configurado (' + configToUpdate.mercadoPagoAccessToken.length + ' caracteres)' : '❌ Não configurado'}`);
    console.log(`   Public Key: ${configToUpdate.mercadoPagoPublicKey ? '✅ Configurado (' + configToUpdate.mercadoPagoPublicKey.length + ' caracteres)' : '❌ Não configurado'}`);
    
    if (configToUpdate.mercadoPagoAccessToken) {
      const isTest = configToUpdate.mercadoPagoAccessToken.includes('TEST');
      console.log(`   Token Type: ${isTest ? '🧪 TEST' : '✅ PRODUCTION'}\n`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  }
})();
