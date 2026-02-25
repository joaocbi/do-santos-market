import { NextResponse } from 'next/server';
import { dbPostgres, isPostgresAvailable } from '@/lib/db';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    if (!isPostgresAvailable()) {
      return NextResponse.json({ 
        error: 'Postgres not available',
        message: 'This endpoint only works in production with Postgres configured'
      }, { status: 400 });
    }

    const dataPath = path.join(process.cwd(), 'data');
    const bannersFile = path.join(dataPath, 'banners.json');

    if (!fs.existsSync(bannersFile)) {
      return NextResponse.json({ 
        error: 'No banners.json found',
        message: 'No local banners file to migrate'
      }, { status: 404 });
    }

    const banners = JSON.parse(fs.readFileSync(bannersFile, 'utf8'));

    if (!Array.isArray(banners) || banners.length === 0) {
      return NextResponse.json({ 
        message: 'No banners to migrate',
        count: 0
      });
    }

    const postgresUrl = process.env.POSTGRES_URL || 
                       process.env.URL_POSTGRES || 
                       process.env.DATABASE_URL;

    if (!postgresUrl) {
      return NextResponse.json({ 
        error: 'POSTGRES_URL not configured'
      }, { status: 500 });
    }

    const cleanUrl = postgresUrl.replace(/^postgres:\/\//, 'postgresql://');
    const sql = neon(cleanUrl);

    const results = [];
    for (const banner of banners) {
      try {
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
        results.push({ id: banner.id, title: banner.title, status: 'success' });
      } catch (error: any) {
        results.push({ id: banner.id, title: banner.title, status: 'error', error: error.message });
      }
    }

    return NextResponse.json({
      message: 'Migration completed',
      total: banners.length,
      results
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error?.message 
    }, { status: 500 });
  }
}
