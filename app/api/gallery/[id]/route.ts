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
      updated = await dbPostgres.gallery.update(params.id, data);
    } else {
      updated = db.gallery.update(params.id, data);
    }
    
    if (!updated) {
      return NextResponse.json({ error: 'Gallery image not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating gallery image:', error);
    return NextResponse.json({ error: 'Failed to update gallery image' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let deleted: boolean;
    
    if (isPostgresAvailable()) {
      deleted = await dbPostgres.gallery.delete(params.id);
    } else {
      deleted = db.gallery.delete(params.id);
    }
    
    if (!deleted) {
      return NextResponse.json({ error: 'Gallery image not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json({ error: 'Failed to delete gallery image' }, { status: 500 });
  }
}
