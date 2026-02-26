import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { PaymentMethod } from '@/lib/types';

export async function GET() {
  try {
    let methods;
    if (isPostgresAvailable()) {
      methods = await dbPostgres.paymentMethods.getAll();
    } else {
      methods = db.paymentMethods.getAll();
    }
    return NextResponse.json(methods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
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
    
    let created;
    if (isPostgresAvailable()) {
      created = await dbPostgres.paymentMethods.create(method);
    } else {
      created = db.paymentMethods.create(method);
    }
    
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
  }
}
