import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { autoCommit } from '@/lib/gitAutoCommit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let order;
    if (isPostgresAvailable()) {
      order = await dbPostgres.orders.getById(params.id);
    } else {
      order = db.orders.getById(params.id);
    }
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    let order;
    
    if (isPostgresAvailable()) {
      order = await dbPostgres.orders.getById(params.id);
    } else {
      order = db.orders.getById(params.id);
    }
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    let updated;
    if (isPostgresAvailable()) {
      updated = await dbPostgres.orders.update(params.id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } else {
      updated = db.orders.update(params.id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      // Auto-commit changes
      if (updated) {
        autoCommit(`Update order: ${updated.id}`, ['data/orders.json']).catch(console.error);
      }
    }
    
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
