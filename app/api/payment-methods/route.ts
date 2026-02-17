import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PaymentMethod } from '@/lib/types';

export async function GET() {
  try {
    const methods = db.paymentMethods.getAll();
    return NextResponse.json(methods);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const method: PaymentMethod = {
      id: Date.now().toString(),
      name: data.name,
      type: data.type,
      active: data.active !== false,
      installments: data.installments,
      fee: data.fee ? parseFloat(data.fee) : undefined,
    };
    const created = db.paymentMethods.create(method);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
  }
}
