import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { Banner } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    
    const postgresAvailable = isPostgresAvailable();
    console.log('[Banners API] Postgres available:', postgresAvailable);
    console.log('[Banners API] Position filter:', position);
    
    let banners: Banner[];
    
    if (postgresAvailable) {
      console.log('[Banners API] Fetching from Postgres...');
      banners = await dbPostgres.banners.getAll();
      console.log('[Banners API] Fetched from Postgres:', banners.length, 'banners');
      console.log('[Banners API] All banners:', JSON.stringify(banners, null, 2));
    } else {
      console.log('[Banners API] Fetching from JSON...');
      banners = db.banners.getAll();
      console.log('[Banners API] Fetched from JSON:', banners.length, 'banners');
    }
    
    if (position) {
      const beforeFilter = banners.length;
      banners = banners.filter(b => b.position === position && b.active);
      console.log('[Banners API] After position/active filter:', beforeFilter, '->', banners.length);
      console.log('[Banners API] Filtered banners:', JSON.stringify(banners, null, 2));
    }
    
    const sorted = banners.sort((a, b) => a.order - b.order);
    console.log('[Banners API] Returning', sorted.length, 'banners');
    return NextResponse.json(sorted);
  } catch (error: any) {
    console.error('[Banners API] Error fetching banners:', error);
    console.error('[Banners API] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json({ error: 'Failed to fetch banners', details: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const banner: Banner = {
      id: Date.now().toString(),
      title: data.title,
      image: data.image,
      link: data.link,
      order: data.order || 0,
      active: data.active !== false,
      position: data.position || 'home',
    };
    
    let created: Banner;
    if (isPostgresAvailable()) {
      created = await dbPostgres.banners.create(banner);
    } else {
      created = db.banners.create(banner);
    }
    
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}
