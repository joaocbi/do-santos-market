import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    let updated;
    
    if (isPostgresAvailable()) {
      updated = await dbPostgres.banners.update(params.id, data);
    } else {
      updated = db.banners.update(params.id, data);
    }
    
    if (!updated) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let deleted: boolean;
    
    if (isPostgresAvailable()) {
      deleted = await dbPostgres.banners.delete(params.id);
    } else {
      deleted = db.banners.delete(params.id);
    }
    
    if (!deleted) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
