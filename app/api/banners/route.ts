import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { Banner } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    
    let banners: Banner[];
    
    if (isPostgresAvailable()) {
      banners = await dbPostgres.banners.getAll();
    } else {
      banners = db.banners.getAll();
    }
    
    if (position) {
      banners = banners.filter(b => b.position === position && b.active);
    }
    
    return NextResponse.json(banners.sort((a, b) => a.order - b.order));
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
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
