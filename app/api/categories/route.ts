import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { Category } from '@/lib/types';

export async function GET() {
  try {
    const postgresAvailable = isPostgresAvailable();
    console.log('[Categories API] Postgres available:', postgresAvailable);
    
    let categories: Category[];
    
    if (postgresAvailable) {
      console.log('[Categories API] Fetching from Postgres...');
      categories = await dbPostgres.categories.getAll();
      console.log('[Categories API] Fetched from Postgres:', categories.length, 'categories');
    } else {
      console.log('[Categories API] Fetching from JSON...');
      categories = db.categories.getAll();
      console.log('[Categories API] Fetched from JSON:', categories.length, 'categories');
    }
    
    // Build tree structure
    const categoryMap = new Map<string, Category & { subcategories: Category[] }>();
    const rootCategories: (Category & { subcategories: Category[] })[] = [];

    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, subcategories: [] });
    });

    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.subcategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    const sorted = rootCategories.sort((a, b) => a.order - b.order);
    console.log('[Categories API] Returning', sorted.length, 'root categories');
    return NextResponse.json(sorted);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[Categories API] Error fetching categories:', error);
    console.error('[Categories API] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json({ 
      error: 'Failed to fetch categories', 
      details: error?.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (data.parentId) {
      const allCategories = db.categories.getAll();
      const parent = allCategories.find(c => c.id === data.parentId);
      if (!parent) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 });
      }
    }
    
    const category: Category = {
      id: Date.now().toString(),
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      parentId: data.parentId || undefined,
      image: data.image,
      order: data.order || 0,
    };
    const created = db.categories.create(category);
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category', details: error?.message }, { status: 500 });
  }
}
