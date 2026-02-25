/**
 * Script to check if Mercado Pago credentials are in the database
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
let POSTGRES_URL = '';

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const lines = envFile.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('POSTGRES_URL=') || line.startsWith('URL_POSTGRES=')) {
      POSTGRES_URL = line.substring(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
      break;
    }
  }
}

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL not found in .env.local');
  process.exit(1);
}

async function checkCredentials() {
  console.log('🔍 Checking Mercado Pago credentials in database...\n');
  
  try {
    const sql = neon(POSTGRES_URL);
    
    // Check if site_config table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'site_config'
      )
    `;
    
    if (!tableCheck[0].exists) {
      console.error('❌ Table site_config does not exist!');
      return;
    }
    
    console.log('✅ Table site_config exists\n');
    
    // Get config
    const config = await sql`
      SELECT 
        id,
        whatsapp_number,
        email,
        mercado_pago_access_token,
        mercado_pago_public_key,
        created_at,
        updated_at
      FROM site_config
      WHERE id = 'config'
      LIMIT 1
    `;
    
    if (config.length === 0) {
      console.log('⚠️  No config found in database');
      console.log('   Creating default config...');
      
      await sql`
        INSERT INTO site_config (id, whatsapp_number, email, social_media, mercado_pago_access_token, mercado_pago_public_key)
        VALUES ('config', '', '', '{}'::jsonb, '', '')
      `;
      
      console.log('✅ Default config created');
      console.log('\n📋 Next steps:');
      console.log('   1. Configure Mercado Pago credentials via admin panel');
      console.log('   2. Or update directly in database');
      return;
    }
    
    const cfg = config[0];
    
    console.log('📋 Current Configuration:');
    console.log(`   ID: ${cfg.id}`);
    console.log(`   WhatsApp: ${cfg.whatsapp_number || '(empty)'}`);
    console.log(`   Email: ${cfg.email || '(empty)'}`);
    console.log(`   Access Token: ${cfg.mercado_pago_access_token ? `${cfg.mercado_pago_access_token.substring(0, 20)}... (${cfg.mercado_pago_access_token.length} chars)` : '(empty)'}`);
    console.log(`   Public Key: ${cfg.mercado_pago_public_key ? `${cfg.mercado_pago_public_key.substring(0, 20)}... (${cfg.mercado_pago_public_key.length} chars)` : '(empty)'}`);
    console.log(`   Created: ${cfg.created_at}`);
    console.log(`   Updated: ${cfg.updated_at}`);
    
    console.log('\n🔍 Status:');
    
    if (!cfg.mercado_pago_access_token || cfg.mercado_pago_access_token.length === 0) {
      console.log('   ❌ Mercado Pago Access Token: NOT CONFIGURED');
    } else {
      const isTest = cfg.mercado_pago_access_token.includes('TEST');
      console.log(`   ${isTest ? '⚠️' : '✅'} Mercado Pago Access Token: ${isTest ? 'TEST TOKEN' : 'PRODUCTION TOKEN'}`);
    }
    
    if (!cfg.mercado_pago_public_key || cfg.mercado_pago_public_key.length === 0) {
      console.log('   ⚠️  Mercado Pago Public Key: NOT CONFIGURED (optional)');
    } else {
      console.log('   ✅ Mercado Pago Public Key: CONFIGURED');
    }
    
    if (!cfg.mercado_pago_access_token || cfg.mercado_pago_access_token.length === 0) {
      console.log('\n❌ PROBLEM: Mercado Pago Access Token is missing!');
      console.log('\n📋 To fix:');
      console.log('   1. Get your Access Token from Mercado Pago dashboard');
      console.log('   2. Update via admin panel or run:');
      console.log('      UPDATE site_config SET mercado_pago_access_token = \'YOUR_TOKEN\' WHERE id = \'config\';');
    } else {
      console.log('\n✅ Credentials are in database!');
      console.log('   The endpoint should now work correctly.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

checkCredentials();
