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

    // First pass: Create the map with all categories
    categories.forEach(cat => {
      const idStr = String(cat.id);
      categoryMap.set(idStr, { 
        ...cat, 
        id: idStr, 
        parentId: cat.parentId ? String(cat.parentId) : undefined,
        subcategories: [] 
      });
    });

    // Second pass: Build the tree
    categories.forEach(cat => {
      const idStr = String(cat.id);
      const category = categoryMap.get(idStr);
      
      if (!category) return; // Should not happen

      if (cat.parentId) {
        const parentIdStr = String(cat.parentId);
        
        // Circular reference check
        if (parentIdStr === idStr) {
          console.error(`[Categories API] Circular reference detected: category ${idStr} is its own parent.`);
          rootCategories.push(category);
          return;
        }

        const parent = categoryMap.get(parentIdStr);
        if (parent) {
          // Check if already added to subcategories to avoid duplicates
          if (!parent.subcategories.some(sub => sub.id === idStr)) {
            parent.subcategories.push(category);
          }
        } else {
          // Parent not found in the list, treat as root to avoid losing the category
          console.warn(`[Categories API] Parent ${parentIdStr} not found for category ${idStr}. Treating as root.`);
          rootCategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    // Remove duplicates from rootCategories (could happen if parent was not found)
    const uniqueRootCategories = Array.from(new Map(rootCategories.map(c => [c.id, c])).values());

    const sorted = uniqueRootCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
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
      error: 'Falha ao buscar categorias', 
      details: error?.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const postgresAvailable = isPostgresAvailable();
    
    // Clean and validate parentId
    const parentId = (data.parentId && String(data.parentId).trim() !== '' && String(data.parentId) !== 'null' && String(data.parentId) !== 'undefined') 
      ? String(data.parentId) 
      : undefined;

    if (parentId) {
      let parent;
      if (postgresAvailable) {
        parent = await dbPostgres.categories.getById(parentId);
      } else {
        const allCategories = db.categories.getAll();
        parent = allCategories.find(c => String(c.id) === parentId);
      }
      
      if (!parent) {
        console.error(`[Categories API] Parent category not found: ${parentId}`);
        return NextResponse.json({ error: `Categoria pai não encontrada (ID: ${parentId})` }, { status: 400 });
      }
    }
    
    const category: Category = {
      id: Date.now().toString(),
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      parentId: parentId,
      image: data.image || undefined,
      order: data.order || 0,
    };

    let created;
    if (postgresAvailable) {
      created = await dbPostgres.categories.create(category);
    } else {
      created = db.categories.create(category);
    }
    
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Falha ao criar categoria', details: error?.message }, { status: 500 });
  }
}
