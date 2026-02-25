/**
 * Migration script to move data from JSON files to Postgres database
 * 
 * Usage:
 * 1. Set POSTGRES_URL environment variable
 * 2. Run: node scripts/migrate-to-postgres.js
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read from .env.local if POSTGRES_URL is not set
let POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  const envPath = path.join(process.cwd(), '.env.local');
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
}

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL environment variable is required');
  console.log('Set it with: export POSTGRES_URL="your-connection-string"');
  console.log('Or add it to .env.local file');
  process.exit(1);
}

// Clean connection string
const cleanUrl = POSTGRES_URL
  .replace(/^["']|["']$/g, '') // Remove surrounding quotes
  .replace(/[\r\n\t]/g, '') // Remove line breaks and tabs
  .trim(); // Remove leading/trailing whitespace

const sql = neon(cleanUrl);
const dataPath = path.join(process.cwd(), 'data');

async function migrateTable(tableName, jsonFile, transformFn) {
  try {
    const filePath = path.join(dataPath, jsonFile);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${jsonFile} not found, skipping...`);
      return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`ℹ️  ${jsonFile} is empty, skipping...`);
      return;
    }

    console.log(`📦 Migrating ${data.length} records from ${jsonFile}...`);

    for (const item of data) {
      try {
        await transformFn(item, sql);
      } catch (error) {
        console.error(`❌ Error migrating item ${item.id || 'unknown'}:`, error.message);
      }
    }

    console.log(`✅ Successfully migrated ${jsonFile}`);
  } catch (error) {
    console.error(`❌ Error migrating ${jsonFile}:`, error.message);
  }
}

async function migrate() {
  console.log('🚀 Starting migration to Postgres...\n');

  // Migrate categories
  await migrateTable('categories', 'categories.json', async (category, sql) => {
    await sql`
      INSERT INTO categories (id, name, slug, parent_id, image, "order")
      VALUES (${category.id}, ${category.name}, ${category.slug}, ${category.parentId || null}, ${category.image || null}, ${category.order || 0})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        parent_id = EXCLUDED.parent_id,
        image = EXCLUDED.image,
        "order" = EXCLUDED."order"
    `;
  });

  // Migrate products
  await migrateTable('products', 'products.json', async (product, sql) => {
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
  });

  // Migrate config
  await migrateTable('config', 'config.json', async (config, sql) => {
    await sql`
      INSERT INTO site_config (id, whatsapp_number, email, social_media, mercado_pago_access_token, mercado_pago_public_key)
      VALUES ('config', ${config.whatsappNumber || ''}, ${config.email || ''},
              ${JSON.stringify(config.socialMedia || {})}::jsonb,
              ${config.mercadoPagoAccessToken || ''}, ${config.mercadoPagoPublicKey || ''})
      ON CONFLICT (id) DO UPDATE SET
        whatsapp_number = EXCLUDED.whatsapp_number,
        email = EXCLUDED.email,
        social_media = EXCLUDED.social_media,
        mercado_pago_access_token = EXCLUDED.mercado_pago_access_token,
        mercado_pago_public_key = EXCLUDED.mercado_pago_public_key,
        updated_at = CURRENT_TIMESTAMP
    `;
  });

  // Migrate orders
  await migrateTable('orders', 'orders.json', async (order, sql) => {
    await sql`
      INSERT INTO orders (id, customer_name, customer_email, customer_phone, customer_cpf,
                         address, items, subtotal, shipping_fee, total, payment_method,
                         payment_status, payment_id, mercado_pago_payment_id, notes, status, created_at, updated_at)
      VALUES (${order.id}, ${order.customerName}, ${order.customerEmail}, ${order.customerPhone},
              ${order.customerCpf || null}, ${JSON.stringify(order.address)}::jsonb,
              ${JSON.stringify(order.items)}::jsonb, ${order.subtotal}, ${order.shippingFee},
              ${order.total}, ${order.paymentMethod}, ${order.paymentStatus || 'pending'},
              ${order.paymentId || null}, ${order.mercadoPagoPaymentId || null},
              ${order.notes || null}, ${order.status || 'pending'},
              ${order.createdAt || new Date().toISOString()}, ${order.updatedAt || new Date().toISOString()})
      ON CONFLICT (id) DO UPDATE SET
        payment_status = EXCLUDED.payment_status,
        payment_id = EXCLUDED.payment_id,
        mercado_pago_payment_id = EXCLUDED.mercado_pago_payment_id,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
    `;
  });

  // Migrate other tables
  const otherTables = [
    { 
      file: 'paymentMethods.json', 
      table: 'payment_methods',
      migrate: async (item, sql) => {
        await sql`
          INSERT INTO payment_methods (id, name, type, active, installments, fee)
          VALUES (${item.id}, ${item.name}, ${item.type}, ${item.active !== false},
                  ${item.installments || null}, ${item.fee || null})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            type = EXCLUDED.type,
            active = EXCLUDED.active,
            installments = EXCLUDED.installments,
            fee = EXCLUDED.fee
        `;
      }
    },
    { 
      file: 'deliveryMethods.json', 
      table: 'delivery_methods',
      migrate: async (item, sql) => {
        await sql`
          INSERT INTO delivery_methods (id, name, price, estimated_days, active, free_shipping_threshold)
          VALUES (${item.id}, ${item.name}, ${item.price}, ${item.estimatedDays || 0},
                  ${item.active !== false}, ${item.freeShippingThreshold || null})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            estimated_days = EXCLUDED.estimated_days,
            active = EXCLUDED.active,
            free_shipping_threshold = EXCLUDED.free_shipping_threshold
        `;
      }
    },
    { 
      file: 'banners.json', 
      table: 'banners',
      migrate: async (item, sql) => {
        await sql`
          INSERT INTO banners (id, title, image, link, "order", active, position)
          VALUES (${item.id}, ${item.title}, ${item.image}, ${item.link || null},
                  ${item.order || 0}, ${item.active !== false}, ${item.position || 'home'})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            image = EXCLUDED.image,
            link = EXCLUDED.link,
            "order" = EXCLUDED."order",
            active = EXCLUDED.active,
            position = EXCLUDED.position,
            updated_at = CURRENT_TIMESTAMP
        `;
      }
    },
    { 
      file: 'links.json', 
      table: 'links',
      migrate: async (item, sql) => {
        await sql`
          INSERT INTO links (id, title, url, icon, "order", active)
          VALUES (${item.id}, ${item.title}, ${item.url}, ${item.icon || null},
                  ${item.order || 0}, ${item.active !== false})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            url = EXCLUDED.url,
            icon = EXCLUDED.icon,
            "order" = EXCLUDED."order",
            active = EXCLUDED.active,
            updated_at = CURRENT_TIMESTAMP
        `;
      }
    },
    { 
      file: 'gallery.json', 
      table: 'gallery_images',
      migrate: async (item, sql) => {
        await sql`
          INSERT INTO gallery_images (id, url, alt, "order", category)
          VALUES (${item.id}, ${item.url}, ${item.alt || null}, ${item.order || 0}, ${item.category || null})
          ON CONFLICT (id) DO UPDATE SET
            url = EXCLUDED.url,
            alt = EXCLUDED.alt,
            "order" = EXCLUDED."order",
            category = EXCLUDED.category,
            updated_at = CURRENT_TIMESTAMP
        `;
      }
    },
    { 
      file: 'videos.json', 
      table: 'videos',
      migrate: async (item, sql) => {
        await sql`
          INSERT INTO videos (id, title, url, type, thumbnail, "order", active)
          VALUES (${item.id}, ${item.title}, ${item.url}, ${item.type},
                  ${item.thumbnail || null}, ${item.order || 0}, ${item.active !== false})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            url = EXCLUDED.url,
            type = EXCLUDED.type,
            thumbnail = EXCLUDED.thumbnail,
            "order" = EXCLUDED."order",
            active = EXCLUDED.active,
            updated_at = CURRENT_TIMESTAMP
        `;
      }
    },
  ];

  for (const { file, table, migrate } of otherTables) {
    await migrateTable(table, file, migrate);
  }

  console.log('\n✅ Migration completed!');
}

migrate().catch(console.error);
