import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { autoCommit } from '@/lib/gitAutoCommit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let product;
    if (isPostgresAvailable()) {
      product = await dbPostgres.products.getById(params.id);
    } else {
      product = db.products.getById(params.id);
    }
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    let product;
    let allProducts;
    
    if (isPostgresAvailable()) {
      product = await dbPostgres.products.getById(params.id);
      allProducts = await dbPostgres.products.getAll();
    } else {
      product = db.products.getById(params.id);
      allProducts = db.products.getAll();
    }
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Verifica duplicatas (excluindo o produto atual)
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
    
    let updated;
    if (isPostgresAvailable()) {
      updated = await dbPostgres.products.update(params.id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } else {
      updated = db.products.update(params.id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      // Auto-commit changes
      autoCommit(`Update product: ${updated.name || product?.name || params.id}`, ['data/products.json']).catch(console.error);
    }
    
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let product;
    let deleted: boolean;
    
    if (isPostgresAvailable()) {
      product = await dbPostgres.products.getById(params.id);
      deleted = await dbPostgres.products.delete(params.id);
    } else {
      product = db.products.getById(params.id);
      deleted = db.products.delete(params.id);
      // Auto-commit changes
      autoCommit(`Delete product: ${product?.name || params.id}`, ['data/products.json']).catch(console.error);
    }
    
    if (!deleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
