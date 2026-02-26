import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { GalleryImage } from '@/lib/types';

export async function GET() {
  try {
    let images;
    if (isPostgresAvailable()) {
      images = await dbPostgres.gallery.getAll();
    } else {
      images = db.gallery.getAll();
    }
    return NextResponse.json(images.sort((a, b) => a.order - b.order));
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const image: GalleryImage = {
      id: Date.now().toString(),
      url: data.url,
      alt: data.alt || '',
      order: data.order || 0,
      category: data.category,
    };
    
    let created;
    if (isPostgresAvailable()) {
      created = await dbPostgres.gallery.create(image);
    } else {
      created = db.gallery.create(image);
    }
    
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating gallery image:', error);
    return NextResponse.json({ error: 'Failed to create gallery image' }, { status: 500 });
  }
}
