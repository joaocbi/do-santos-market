/**
 * Script para criar tabelas diretamente usando template literals
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
    console.log('📝 Criando tabelas...\n');
    
    // Create categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        parent_id VARCHAR(255),
        image TEXT,
        "order" INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabela categories criada');
    
    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        cost_price DECIMAL(10, 2),
        images JSONB DEFAULT '[]'::jsonb,
        video TEXT,
        category_id VARCHAR(255) NOT NULL,
        subcategory_id VARCHAR(255),
        sku VARCHAR(255) NOT NULL,
        stock INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT true,
        featured BOOLEAN DEFAULT false,
        observations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `;
    console.log('✅ Tabela products criada');
    
    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(255) NOT NULL,
        customer_cpf VARCHAR(255),
        address JSONB NOT NULL,
        items JSONB NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        shipping_fee DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(255) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_id VARCHAR(255),
        mercado_pago_payment_id VARCHAR(255),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabela orders criada');
    
    // Create site_config table
    await sql`
      CREATE TABLE IF NOT EXISTS site_config (
        id VARCHAR(255) PRIMARY KEY DEFAULT 'config',
        whatsapp_number VARCHAR(255) DEFAULT '',
        email VARCHAR(255) DEFAULT '',
        social_media JSONB DEFAULT '{}'::jsonb,
        mercado_pago_access_token TEXT DEFAULT '',
        mercado_pago_public_key TEXT DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabela site_config criada');
    
    // Verify
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`\n✅ ${tables.length} tabelas criadas:`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
})();
