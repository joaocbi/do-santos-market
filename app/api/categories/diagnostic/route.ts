import { NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';

export async function GET() {
  try {
    const postgresAvailable = isPostgresAvailable();
    
    let categoriesFromJson: any[] = [];
    let categoriesFromPostgres: any[] = [];
    let error: string | null = null;
    
    // Try to get from JSON
    try {
      categoriesFromJson = db.categories.getAll();
    } catch (e: any) {
      console.error('Error reading JSON:', e);
    }
    
    // Try to get from Postgres
    if (postgresAvailable) {
      try {
        categoriesFromPostgres = await dbPostgres.categories.getAll();
      } catch (e: any) {
        error = e?.message || 'Unknown error';
        console.error('Error reading Postgres:', e);
      }
    }
    
    return NextResponse.json({
      postgresAvailable,
      postgresUrlConfigured: !!(process.env.POSTGRES_URL || 
                                process.env.URL_POSTGRES || 
                                process.env.DATABASE_URL),
      vercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
      categoriesFromJson: {
        count: categoriesFromJson.length,
        categories: categoriesFromJson.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          parentId: c.parentId,
          order: c.order
        }))
      },
      categoriesFromPostgres: {
        count: categoriesFromPostgres.length,
        categories: categoriesFromPostgres.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          parentId: c.parentId,
          order: c.order
        })),
        error
      },
      rootCategories: {
        fromJson: categoriesFromJson.filter(c => !c.parentId),
        fromPostgres: categoriesFromPostgres.filter(c => !c.parentId)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error?.message || 'Unknown error',
      stack: error?.stack 
    }, { status: 500 });
  }
}
