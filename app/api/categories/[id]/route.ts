import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = db.categories.getById(params.id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

const getAllDescendantIds = (parentId: string, categories: any[]): string[] => {
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    if (data.parentId) {
      const allCategories = db.categories.getAll();
      
      if (data.parentId === params.id) {
        return NextResponse.json({ error: 'Category cannot be its own parent' }, { status: 400 });
      }
      
      const descendants = getAllDescendantIds(params.id, allCategories);
      if (descendants.includes(data.parentId)) {
        return NextResponse.json({ error: 'Cannot set a descendant category as parent' }, { status: 400 });
      }
      
      const parent = allCategories.find(c => c.id === data.parentId);
      if (!parent) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 });
      }
    }
    
    const updated = db.categories.update(params.id, data);
    if (!updated) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const allCategories = db.categories.getAll();
    const category = allCategories.find(c => c.id === params.id);
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    const descendants = getAllDescendantIds(params.id, allCategories);
    const idsToDelete = [params.id, ...descendants];
    
    idsToDelete.forEach(id => {
      db.categories.delete(id);
    });
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: idsToDelete.length,
      message: idsToDelete.length > 1 
        ? `Category and ${idsToDelete.length - 1} subcategories deleted`
        : 'Category deleted'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
