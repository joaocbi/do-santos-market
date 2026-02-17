import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Customer } from '@/lib/types';

export async function GET() {
  try {
    const customers = db.customers.getAll();
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const customer: Customer = {
      id: Date.now().toString(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      cpf: data.cpf,
      address: data.address || [],
      createdAt: new Date().toISOString(),
    };
    const created = db.customers.create(customer);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
