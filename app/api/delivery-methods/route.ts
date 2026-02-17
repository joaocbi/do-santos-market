import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DeliveryMethod } from '@/lib/types';

export async function GET() {
  try {
    const methods = db.deliveryMethods.getAll();
    return NextResponse.json(methods);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch delivery methods' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const method: DeliveryMethod = {
      id: Date.now().toString(),
      name: data.name,
      price: parseFloat(data.price),
      estimatedDays: parseInt(data.estimatedDays) || 1,
      active: data.active !== false,
      freeShippingThreshold: data.freeShippingThreshold ? parseFloat(data.freeShippingThreshold) : undefined,
    };
    const created = db.deliveryMethods.create(method);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create delivery method' }, { status: 500 });
  }
}
