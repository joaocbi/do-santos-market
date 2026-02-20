import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Order } from '@/lib/types';
import { autoCommit } from '@/lib/gitAutoCommit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    
    let orders = db.orders.getAll();
    
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    
    if (paymentStatus) {
      orders = orders.filter(o => o.paymentStatus === paymentStatus);
    }
    
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const order: Order = {
      id: Date.now().toString(),
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      customerCpf: data.customerCpf,
      address: data.address,
      items: data.items,
      subtotal: parseFloat(data.subtotal),
      shippingFee: parseFloat(data.shippingFee),
      total: parseFloat(data.total),
      paymentMethod: data.paymentMethod,
      paymentStatus: 'pending',
      notes: data.notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const created = db.orders.create(order);
    
    // Auto-commit changes
    autoCommit(`Create order: ${order.id}`, ['data/orders.json']).catch(console.error);
    
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    const errorMessage = error?.message || 'Failed to create order';
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}
