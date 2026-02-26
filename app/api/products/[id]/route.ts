import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { autoCommit } from '@/lib/gitAutoCommit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const productId = String(resolvedParams.id);
    
    console.log(`[Products API] GET request for product ID: ${productId}`);
    
    const postgresAvailable = isPostgresAvailable();
    let product;
    
    if (postgresAvailable) {
      product = await dbPostgres.products.getById(productId);
    } else {
      product = db.products.getById(productId);
      
      // Debug: list all product IDs if not found
      if (!product) {
        const allProducts = db.products.getAll();
        console.log(`[Products API] Product not found: ${productId}`);
        console.log(`[Products API] Available product IDs (first 10): ${allProducts.slice(0, 10).map(p => String(p.id)).join(', ')}`);
      }
    }
    
    if (!product) {
      console.error(`[Products API] Product not found: ${productId}`);
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    
    console.log(`[Products API] Product found: ${product.name} (${productId})`);
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Falha ao buscar produto' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const data = await request.json();
    const productId = String(resolvedParams.id);
    
    let product;
    let allProducts;
    
    if (isPostgresAvailable()) {
      product = await dbPostgres.products.getById(productId);
      allProducts = await dbPostgres.products.getAll();
    } else {
      product = db.products.getById(productId);
      allProducts = db.products.getAll();
    }
    
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    
    // Verifica duplicatas (excluindo o produto atual)
    const duplicateName = allProducts.find(p => 
      String(p.id) !== productId && 
      p.name.toLowerCase().trim() === data.name.toLowerCase().trim()
    );
    
    const skuToCheck = data.sku || product.sku;
    const duplicateSku = allProducts.find(p => 
      String(p.id) !== productId && 
      p.sku.toLowerCase().trim() === skuToCheck.toLowerCase().trim()
    );
    
    if (duplicateName || duplicateSku) {
      let errorMessage = 'Produto duplicado detectado: ';
      const errors: string[] = [];
      if (duplicateName) {
        errors.push(`Nome "${duplicateName.name}" já existe (ID: ${duplicateName.id})`);
      }
      if (duplicateSku) {
        errors.push(`SKU "${duplicateSku.sku}" já existe (Produto: ${duplicateSku.name})`);
      }
      return NextResponse.json({ 
        error: errorMessage + errors.join('; ') 
      }, { status: 409 });
    }
    
    let updated;
    if (isPostgresAvailable()) {
      updated = await dbPostgres.products.update(productId, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } else {
      updated = db.products.update(productId, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      // Auto-commit changes
      if (updated) {
        autoCommit(`Update product: ${updated.name || product?.name || productId}`, ['data/products.json']).catch(console.error);
      }
    }

    if (!updated) {
      return NextResponse.json({ error: 'Falha ao atualizar produto' }, { status: 500 });
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Falha ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const productId = String(resolvedParams.id);
    let product;
    let deleted: boolean;
    
    if (isPostgresAvailable()) {
      product = await dbPostgres.products.getById(productId);
      deleted = await dbPostgres.products.delete(productId);
    } else {
      product = db.products.getById(productId);
      deleted = db.products.delete(productId);
      // Auto-commit changes
      autoCommit(`Delete product: ${product?.name || productId}`, ['data/products.json']).catch(console.error);
    }
    
    if (!deleted) {
      console.error(`[Products API] Product not found: ${productId}`);
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Falha ao excluir produto' }, { status: 500 });
  }
}
