import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GalleryImage } from '@/lib/types';

export async function GET() {
  try {
    const images = db.gallery.getAll();
    return NextResponse.json(images.sort((a, b) => a.order - b.order));
  } catch (error) {
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
    const created = db.gallery.create(image);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create gallery image' }, { status: 500 });
  }
}
