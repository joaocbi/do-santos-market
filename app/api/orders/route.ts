import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { Order } from '@/lib/types';
import { autoCommit } from '@/lib/gitAutoCommit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    
    let orders: Order[];
    
    if (isPostgresAvailable()) {
      orders = await dbPostgres.orders.getAll();
    } else {
      orders = db.orders.getAll();
    }
    
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    
    if (paymentStatus) {
      orders = orders.filter(o => o.paymentStatus === paymentStatus);
    }
    
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch orders',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
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
    
    let created: Order;
    
    // Check Postgres availability
    const postgresAvailable = isPostgresAvailable();
    console.log('Postgres available:', postgresAvailable);
    console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
    
    if (postgresAvailable) {
      try {
        console.log('Creating order in Postgres...');
        created = await dbPostgres.orders.create(order);
        console.log('Order created successfully:', order.id);
      } catch (dbError: any) {
        console.error('Postgres error:', dbError);
        console.error('Error details:', {
          message: dbError?.message,
          code: dbError?.code,
          detail: dbError?.detail,
          hint: dbError?.hint
        });
        throw new Error(`Database error: ${dbError?.message || 'Unknown error'}`);
      }
    } else if (process.env.VERCEL) {
      // In Vercel without Postgres, we can't write to filesystem
      // Return error asking to configure Postgres
      return NextResponse.json({ 
        error: 'Database not configured. Please configure POSTGRES_URL environment variable.',
        details: 'The application requires a database to store orders. Please set up Vercel Postgres or Neon database.'
      }, { status: 500 });
    } else {
      // Local development with JSON files
      created = db.orders.create(order);
      // Auto-commit changes (only for JSON mode)
      autoCommit(`Create order: ${order.id}`, ['data/orders.json']).catch(console.error);
    }
    
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    const errorMessage = error?.message || 'Failed to create order';
    console.error('Full error:', JSON.stringify(error, null, 2));
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : error?.message
    }, { status: 500 });
  }
}
