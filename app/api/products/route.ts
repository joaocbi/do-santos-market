import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { Product } from '@/lib/types';
import { autoCommit } from '@/lib/gitAutoCommit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const featured = searchParams.get('featured');
    
    let products: Product[];
    
    if (isPostgresAvailable()) {
      products = await dbPostgres.products.getAll();
    } else {
      products = db.products.getAll();
    }
    
    if (categoryId) {
      products = products.filter(p => p.categoryId === categoryId || p.subcategoryId === categoryId);
    }
    
    if (featured === 'true') {
      products = products.filter(p => p.featured);
    }
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    let allProducts: Product[];
    if (isPostgresAvailable()) {
      allProducts = await dbPostgres.products.getAll();
    } else {
      allProducts = db.products.getAll();
    }
    
    // Verifica duplicatas
    const duplicateName = allProducts.find(p => 
      p.name.toLowerCase().trim() === data.name.toLowerCase().trim()
    );
    
    const skuToCheck = data.sku || `SKU-${Date.now()}`;
    const duplicateSku = allProducts.find(p => 
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
    
    const product: Product = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description || '',
      price: parseFloat(data.price),
      originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : undefined,
      costPrice: data.costPrice ? parseFloat(data.costPrice) : undefined,
      images: Array.isArray(data.images) ? data.images : [],
      video: data.video && data.video.trim() !== '' ? data.video : undefined,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      sku: skuToCheck,
      stock: parseInt(data.stock) || 0,
      active: data.active !== false,
      featured: data.featured || false,
      observations: data.observations || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    let created: Product;
    if (isPostgresAvailable()) {
      created = await dbPostgres.products.create(product);
    } else {
      created = db.products.create(product);
      // Auto-commit changes
      autoCommit(`Add product: ${product.name}`, ['data/products.json']).catch(console.error);
    }
    
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
