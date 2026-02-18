import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { autoCommit } from '@/lib/gitAutoCommit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = db.products.getById(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const product = db.products.getById(params.id);
    const updated = db.products.update(params.id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Auto-commit changes
    autoCommit(`Update product: ${updated.name || product?.name || params.id}`, ['data/products.json']).catch(console.error);
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = db.products.getById(params.id);
    const deleted = db.products.delete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Auto-commit changes
    autoCommit(`Delete product: ${product?.name || params.id}`, ['data/products.json']).catch(console.error);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
