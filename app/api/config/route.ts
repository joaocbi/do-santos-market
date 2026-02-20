import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';

export async function GET() {
  try {
    const config = isPostgresAvailable() 
      ? await dbPostgres.config.get()
      : db.config.get();
    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch config',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const updated = isPostgresAvailable()
      ? await dbPostgres.config.update(data)
      : db.config.update(data);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating config:', error);
    return NextResponse.json({ 
      error: 'Failed to update config',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}
