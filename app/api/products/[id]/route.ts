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
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Verifica duplicatas (excluindo o produto atual)
    const allProducts = db.products.getAll();
    const duplicateName = allProducts.find(p => 
      p.id !== params.id && 
      p.name.toLowerCase().trim() === data.name.toLowerCase().trim()
    );
    
    const skuToCheck = data.sku || product.sku;
    const duplicateSku = allProducts.find(p => 
      p.id !== params.id && 
      p.sku.toLowerCase().trim() === skuToCheck.toLowerCase().trim()
    );
    
    if (duplicateName || duplicateSku) {
      let errorMessage = 'Duplicate product detected: ';
      const errors: string[] = [];
      if (duplicateName) {
        errors.push(`Name "${duplicateName.name}" already exists (ID: ${duplicateName.id})`);
      }
      if (duplicateSku) {
        errors.push(`SKU "${duplicateSku.sku}" already exists (Product: ${duplicateSku.name})`);
      }
      return NextResponse.json({ 
        error: errorMessage + errors.join('; ') 
      }, { status: 409 });
    }
    
    const updated = db.products.update(params.id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    
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
