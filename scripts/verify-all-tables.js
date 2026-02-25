/**
 * Script para verificar se todas as tabelas do schema foram criadas
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
    if (line.startsWith('POSTGRES_URL=')) {
      POSTGRES_URL = line.substring('POSTGRES_URL='.length).trim();
      if ((POSTGRES_URL.startsWith('"') && POSTGRES_URL.endsWith('"')) || 
          (POSTGRES_URL.startsWith("'") && POSTGRES_URL.endsWith("'"))) {
        POSTGRES_URL = POSTGRES_URL.slice(1, -1);
      }
      POSTGRES_URL = POSTGRES_URL.replace(/[\r\n\t]/g, '').trim();
      break;
    }
  }
}

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não encontrada no .env.local');
  process.exit(1);
}

const cleanUrl = POSTGRES_URL
  .replace(/^["']|["']$/g, '')
  .replace(/[\r\n\t]/g, '')
  .trim();

const sql = neon(cleanUrl);

// Expected tables from schema.sql
const expectedTables = [
  'categories',
  'products',
  'customers',
  'payment_methods',
  'delivery_methods',
  'banners',
  'links',
  'gallery_images',
  'videos',
  'site_config',
  'orders'
];

(async () => {
  try {
    console.log('📊 Verificando tabelas no banco...\n');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const existingTables = tables.map(t => t.table_name);
    
    console.log(`✅ Encontradas ${existingTables.length} tabelas:\n`);
    existingTables.forEach(t => console.log(`   - ${t}`));
    
    console.log(`\n📋 Tabelas esperadas: ${expectedTables.length}\n`);
    
    const missing = expectedTables.filter(t => !existingTables.includes(t));
    const extra = existingTables.filter(t => !expectedTables.includes(t));
    
    if (missing.length > 0) {
      console.log(`⚠️  Tabelas faltando (${missing.length}):`);
      missing.forEach(t => console.log(`   ❌ ${t}`));
    }
    
    if (extra.length > 0) {
      console.log(`\nℹ️  Tabelas extras (${extra.length}):`);
      extra.forEach(t => console.log(`   + ${t}`));
    }
    
    if (missing.length === 0 && extra.length === 0) {
      console.log('\n✅ Todas as tabelas esperadas foram criadas!');
    } else if (missing.length > 0) {
      console.log('\n⚠️  Execute o schema novamente para criar as tabelas faltantes:');
      console.log('   node scripts/setup-postgres-direct.js');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
})();
