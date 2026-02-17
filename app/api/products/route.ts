import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Product } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const featured = searchParams.get('featured');
    
    let products = db.products.getAll();
    
    if (categoryId) {
      products = products.filter(p => p.categoryId === categoryId || p.subcategoryId === categoryId);
    }
    
    if (featured === 'true') {
      products = products.filter(p => p.featured);
    }
    
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const product: Product = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description || '',
      price: parseFloat(data.price),
      originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : undefined,
      images: Array.isArray(data.images) ? data.images : [],
      video: data.video && data.video.trim() !== '' ? data.video : undefined,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      sku: data.sku || `SKU-${Date.now()}`,
      stock: parseInt(data.stock) || 0,
      active: data.active !== false,
      featured: data.featured || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const created = db.products.create(product);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
