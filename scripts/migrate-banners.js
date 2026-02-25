const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'data');
const bannersFile = path.join(dataPath, 'banners.json');

async function migrateBanners() {
  const postgresUrl = process.env.POSTGRES_URL || process.env.URL_POSTGRES || process.env.DATABASE_URL;
  
  if (!postgresUrl) {
    console.error('❌ POSTGRES_URL not found in environment variables');
    console.log('Please set POSTGRES_URL environment variable');
    process.exit(1);
  }

  if (!fs.existsSync(bannersFile)) {
    console.log('ℹ️  No banners.json file found. Nothing to migrate.');
    return;
  }

  const banners = JSON.parse(fs.readFileSync(bannersFile, 'utf8'));
  
  if (!Array.isArray(banners) || banners.length === 0) {
    console.log('ℹ️  No banners to migrate.');
    return;
  }

  console.log(`📦 Found ${banners.length} banner(s) to migrate\n`);

  const cleanUrl = postgresUrl.replace(/^postgres:\/\//, 'postgresql://');
  const sql = neon(cleanUrl);

  try {
    for (const banner of banners) {
      console.log(`Migrating banner: ${banner.title} (${banner.id})...`);
      
      await sql`
        INSERT INTO banners (id, title, image, link, "order", active, position)
        VALUES (${banner.id}, ${banner.title}, ${banner.image}, ${banner.link || null},
                ${banner.order || 0}, ${banner.active !== false}, ${banner.position || 'home'})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          image = EXCLUDED.image,
          link = EXCLUDED.link,
          "order" = EXCLUDED."order",
          active = EXCLUDED.active,
          position = EXCLUDED.position,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      console.log(`✅ Banner "${banner.title}" migrated successfully`);
    }
    
    console.log(`\n✅ All ${banners.length} banner(s) migrated successfully!`);
  } catch (error) {
    console.error('❌ Error migrating banners:', error.message);
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.error('\n⚠️  The banners table does not exist. Please run the schema.sql first.');
    }
    process.exit(1);
  }
}

migrateBanners();
