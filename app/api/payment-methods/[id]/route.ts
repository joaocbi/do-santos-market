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
      updated = await dbPostgres.paymentMethods.update(params.id, data);
    } else {
      updated = db.paymentMethods.update(params.id, data);
    }
    
    if (!updated) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let deleted: boolean;
    
    if (isPostgresAvailable()) {
      deleted = await dbPostgres.paymentMethods.delete(params.id);
    } else {
      deleted = db.paymentMethods.delete(params.id);
    }
    
    if (!deleted) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 });
  }
}
