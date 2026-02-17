import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Category } from '@/lib/types';

export async function GET() {
  try {
    const categories = db.categories.getAll();
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

    return NextResponse.json(rootCategories.sort((a, b) => a.order - b.order));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

const getAllDescendantIds = (parentId: string, categories: Category[]): string[] => {
  const descendants: string[] = [];
  const findDescendants = (id: string) => {
    categories.forEach(cat => {
      if (cat.parentId === id) {
        descendants.push(cat.id);
        findDescendants(cat.id);
      }
    });
  };
  findDescendants(parentId);
  return descendants;
};

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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
