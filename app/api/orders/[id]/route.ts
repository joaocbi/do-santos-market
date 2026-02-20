import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { autoCommit } from '@/lib/gitAutoCommit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = db.orders.getById(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const order = db.orders.getById(params.id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const updated = db.orders.update(params.id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    
    // Auto-commit changes
    autoCommit(`Update order: ${updated.id}`, ['data/orders.json']).catch(console.error);
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
