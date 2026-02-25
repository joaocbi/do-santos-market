import { NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';

export async function GET() {
  try {
    const postgresAvailable = isPostgresAvailable();
    
    let bannersFromJson: any[] = [];
    let bannersFromPostgres: any[] = [];
    let error: string | null = null;
    
    // Try to get from JSON
    try {
      bannersFromJson = db.banners.getAll();
    } catch (e: any) {
      console.error('Error reading JSON:', e);
    }
    
    // Try to get from Postgres
    if (postgresAvailable) {
      try {
        bannersFromPostgres = await dbPostgres.banners.getAll();
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
      bannersFromJson: {
        count: bannersFromJson.length,
        banners: bannersFromJson
      },
      bannersFromPostgres: {
        count: bannersFromPostgres.length,
        banners: bannersFromPostgres,
        error
      },
      activeHomeBanners: {
        fromJson: bannersFromJson.filter(b => b.position === 'home' && b.active),
        fromPostgres: bannersFromPostgres.filter(b => b.position === 'home' && b.active)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error?.message || 'Unknown error',
      stack: error?.stack 
    }, { status: 500 });
  }
}
