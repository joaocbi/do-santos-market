import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { Video } from '@/lib/types';

export async function GET() {
  try {
    let videos;
    if (isPostgresAvailable()) {
      videos = await dbPostgres.videos.getAll();
    } else {
      videos = db.videos.getAll();
    }
    return NextResponse.json(videos.filter(v => v.active).sort((a, b) => a.order - b.order));
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const video: Video = {
      id: Date.now().toString(),
      title: data.title,
      url: data.url,
      type: data.type || 'youtube',
      thumbnail: data.thumbnail,
      order: data.order || 0,
      active: data.active !== false,
    };
    
    let created;
    if (isPostgresAvailable()) {
      created = await dbPostgres.videos.create(video);
    } else {
      created = db.videos.create(video);
    }
    
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
  }
}
