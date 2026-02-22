/**
 * Script para verificar configuração do Mercado Pago
 * Verifica domínio, URLs de callback e webhook
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
let POSTGRES_URL = '';
let NEXT_PUBLIC_BASE_URL = '';

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
    if (line.startsWith('NEXT_PUBLIC_BASE_URL=')) {
      NEXT_PUBLIC_BASE_URL = line.substring('NEXT_PUBLIC_BASE_URL='.length).trim();
      if ((NEXT_PUBLIC_BASE_URL.startsWith('"') && NEXT_PUBLIC_BASE_URL.endsWith('"')) || 
          (NEXT_PUBLIC_BASE_URL.startsWith("'") && NEXT_PUBLIC_BASE_URL.endsWith("'"))) {
        NEXT_PUBLIC_BASE_URL = NEXT_PUBLIC_BASE_URL.slice(1, -1);
      }
      NEXT_PUBLIC_BASE_URL = NEXT_PUBLIC_BASE_URL.replace(/[\r\n\t]/g, '').trim();
    }
  }
}

const cleanUrl = POSTGRES_URL
  .replace(/^["']|["']$/g, '')
  .replace(/[\r\n\t]/g, '')
  .trim();

const sql = neon(cleanUrl);

(async () => {
  try {
    console.log('🔍 Verificando configuração do Mercado Pago...\n');

    // Get config from database
    const config = await sql`
      SELECT whatsapp_number as "whatsappNumber", email, social_media as "socialMedia",
             mercado_pago_access_token as "mercadoPagoAccessToken",
             mercado_pago_public_key as "mercadoPagoPublicKey"
      FROM site_config
      WHERE id = 'config'
      LIMIT 1
    `;

    if (config.length === 0) {
      console.error('❌ Configuração não encontrada no banco de dados');
      process.exit(1);
    }

    const siteConfig = config[0];

    console.log('📋 Configuração encontrada:');
    console.log(`   Access Token: ${siteConfig.mercadoPagoAccessToken ? '✅ Configurado' : '❌ Não configurado'}`);
    console.log(`   Public Key: ${siteConfig.mercadoPagoPublicKey ? '✅ Configurado' : '❌ Não configurado'}`);
    console.log(`   Token Length: ${siteConfig.mercadoPagoAccessToken?.length || 0} caracteres`);
    console.log(`   Token Type: ${siteConfig.mercadoPagoAccessToken?.includes('TEST') ? '🧪 TEST' : '✅ PRODUCTION'}\n`);

    // Determine base URL
    const baseUrl = NEXT_PUBLIC_BASE_URL || 'https://www.dosantosmarket.com.br';
    console.log('🌐 URLs de Callback e Webhook:');
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   Success: ${baseUrl}/payment/success`);
    console.log(`   Failure: ${baseUrl}/payment/failure`);
    console.log(`   Pending: ${baseUrl}/payment/pending`);
    console.log(`   Webhook: ${baseUrl}/api/payment/webhook\n`);

    // Verify domain
    const domain = baseUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
    console.log('🔗 Domínio:');
    console.log(`   ${domain}`);
    
    // Check if using www or not
    if (baseUrl.includes('www.')) {
      console.log('   ⚠️  Usando www. - Certifique-se de que o domínio está configurado corretamente na Vercel');
    } else {
      console.log('   ℹ️  Sem www. - Certifique-se de que o domínio está configurado corretamente na Vercel');
    }

    console.log('\n📝 Configuração necessária no Mercado Pago:');
    console.log('   1. Acesse: https://www.mercadopago.com.br/developers');
    console.log('   2. Vá em "Suas integrações" → "Webhooks"');
    console.log(`   3. Configure o webhook: ${baseUrl}/api/payment/webhook`);
    console.log('   4. Certifique-se de que o domínio está aprovado no Mercado Pago\n');

    // Test webhook endpoint
    console.log('🧪 Testando webhook endpoint...');
    try {
      const webhookUrl = `${baseUrl}/api/payment/webhook?test=true`;
      const response = await fetch(webhookUrl);
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Webhook está acessível');
        console.log(`   Resposta: ${JSON.stringify(data)}\n`);
      } else {
        console.log(`   ⚠️  Webhook retornou status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Não foi possível testar o webhook: ${error.message}`);
      console.log('   (Isso é normal se estiver testando localmente)\n');
    }

    // Summary
    console.log('✅ Verificação concluída!\n');
    console.log('📋 Checklist:');
    console.log(`   [${siteConfig.mercadoPagoAccessToken ? '✅' : '❌'}] Access Token configurado`);
    console.log(`   [${siteConfig.mercadoPagoPublicKey ? '✅' : '❌'}] Public Key configurado`);
    console.log(`   [${baseUrl ? '✅' : '❌'}] Base URL definida`);
    console.log(`   [ ] Webhook configurado no Mercado Pago`);
    console.log(`   [ ] Domínio aprovado no Mercado Pago\n`);

    // Recommendations
    if (!NEXT_PUBLIC_BASE_URL) {
      console.log('💡 Recomendação:');
      console.log('   Configure NEXT_PUBLIC_BASE_URL na Vercel:');
      console.log('   - Dashboard → Settings → Environment Variables');
      console.log(`   - Key: NEXT_PUBLIC_BASE_URL`);
      console.log(`   - Value: ${baseUrl}`);
      console.log('   - Marque: Production, Preview, Development\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  }
})();
