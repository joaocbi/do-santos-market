/**
 * Script para verificar se as tabelas existem no banco
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
      POSTGRES_URL = POSTGRES_URL.replace(/[\r\n\t\s]/g, '').trim();
      break;
    }
  }
}

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não encontrada');
  process.exit(1);
}

const cleanUrl = POSTGRES_URL
  .replace(/^["']|["']$/g, '')
  .replace(/[\r\n\t]/g, '')
  .trim();

const sql = neon(cleanUrl);

(async () => {
  try {
    console.log('📊 Verificando tabelas no banco...\n');
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`✅ Encontradas ${tables.length} tabelas:\n`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
    // Check products table specifically
    const productsCheck = await sql`
      SELECT COUNT(*) as count FROM products
    `;
    console.log(`\n📦 Produtos na tabela: ${productsCheck[0].count}`);
    
  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.error('❌ Tabelas não existem! Execute o schema primeiro:');
      console.error('   node scripts/setup-postgres-direct.js');
    } else {
      console.error('❌ Erro:', error.message);
    }
    process.exit(1);
  }
})();
