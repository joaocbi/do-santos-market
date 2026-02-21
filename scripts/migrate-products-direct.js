/**
 * Script direto para migrar produtos para Postgres
 * Usa a connection string do .env.local
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
      // Remove quotes
      if ((POSTGRES_URL.startsWith('"') && POSTGRES_URL.endsWith('"')) || 
          (POSTGRES_URL.startsWith("'") && POSTGRES_URL.endsWith("'"))) {
        POSTGRES_URL = POSTGRES_URL.slice(1, -1);
      }
      // Clean all whitespace and line breaks
      POSTGRES_URL = POSTGRES_URL.replace(/[\r\n\t\s]/g, '').trim();
      break;
    }
  }
}

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não encontrada no .env.local');
  console.log('Execute: vercel env pull .env.local --environment production');
  process.exit(1);
}

// Clean connection string
const cleanUrl = POSTGRES_URL
  .replace(/^["']|["']$/g, '')
  .replace(/[\r\n\t]/g, '')
  .trim();

console.log('✅ Connection string encontrada');
console.log('📝 Conectando ao banco...\n');

const sql = neon(cleanUrl);
const dataPath = path.join(process.cwd(), 'data');

async function migrateProducts() {
  try {
    const productsPath = path.join(dataPath, 'products.json');
    if (!fs.existsSync(productsPath)) {
      console.error('❌ Arquivo products.json não encontrado!');
      process.exit(1);
    }

    const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    console.log(`📦 Migrando ${products.length} produtos...\n`);

    let success = 0;
    let errors = 0;

    for (const product of products) {
      try {
        // Convert price from string to number if needed
        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        const originalPrice = product.originalPrice ? (typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice) : product.originalPrice) : null;
        const costPrice = product.costPrice ? (typeof product.costPrice === 'string' ? parseFloat(product.costPrice) : product.costPrice) : null;
        const stock = typeof product.stock === 'string' ? parseInt(product.stock) : (product.stock || 0);

        await sql`
          INSERT INTO products (id, name, description, price, original_price, cost_price, images, video,
                               category_id, subcategory_id, sku, stock, active, featured, observations, created_at, updated_at)
          VALUES (${product.id}, ${product.name}, ${product.description || ''}, ${price},
                  ${originalPrice}, ${costPrice},
                  ${JSON.stringify(product.images || [])}::jsonb, ${product.video || null},
                  ${product.categoryId}, ${product.subcategoryId || null}, ${product.sku},
                  ${stock}, ${product.active !== false}, ${product.featured || false},
                  ${product.observations || null}, ${product.createdAt || new Date().toISOString()},
                  ${product.updatedAt || new Date().toISOString()})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            original_price = EXCLUDED.original_price,
            cost_price = EXCLUDED.cost_price,
            images = EXCLUDED.images,
            video = EXCLUDED.video,
            category_id = EXCLUDED.category_id,
            subcategory_id = EXCLUDED.subcategory_id,
            sku = EXCLUDED.sku,
            stock = EXCLUDED.stock,
            active = EXCLUDED.active,
            featured = EXCLUDED.featured,
            observations = EXCLUDED.observations,
            updated_at = EXCLUDED.updated_at
        `;
        success++;
        if (success % 10 === 0) {
          console.log(`✅ ${success}/${products.length} produtos migrados...`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Erro ao migrar produto ${product.id} (${product.name}):`, error.message);
      }
    }

    console.log(`\n✅ Migração concluída!`);
    console.log(`   Sucesso: ${success}`);
    console.log(`   Erros: ${errors}`);
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    process.exit(1);
  }
}

// Test connection first
sql`SELECT 1 as test`.then(() => {
  console.log('✅ Conexão bem-sucedida!\n');
  migrateProducts().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  });
}).catch(err => {
  console.error('❌ Erro de conexão:', err.message);
  process.exit(1);
});
