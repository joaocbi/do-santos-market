import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { Category, Product } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const postgresAvailable = isPostgresAvailable();
    const categoryId = String(resolvedParams.id);
    
    console.log(`[Categories API] GET request for category ID: ${categoryId}`);
    
    let category;
    
    if (postgresAvailable) {
      category = await dbPostgres.categories.getById(categoryId);
    } else {
      category = db.categories.getById(categoryId);
    }
    
    if (!category) {
      console.error(`[Categories API] Category not found: ${categoryId}`);
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }
    
    console.log(`[Categories API] Category found: ${category.name} (${categoryId})`);
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Falha ao buscar categoria' }, { status: 500 });
  }
}

const getAllDescendantIds = (parentId: string, categories: Category[]): string[] => {
  const descendants: string[] = [];
  const findDescendants = (id: string) => {
    categories.forEach(cat => {
      if (String(cat.parentId) === String(id)) {
        descendants.push(String(cat.id));
        findDescendants(String(cat.id));
      }
    });
  };
  findDescendants(String(parentId));
  return descendants;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const data = await request.json();
    const postgresAvailable = isPostgresAvailable();
    let allCategories: Category[];
    
    if (postgresAvailable) {
      allCategories = await dbPostgres.categories.getAll();
    } else {
      allCategories = db.categories.getAll();
    }
    
    // Clean and validate parentId
    const parentId = (data.parentId && String(data.parentId).trim() !== '' && String(data.parentId) !== 'null' && String(data.parentId) !== 'undefined') 
      ? String(data.parentId) 
      : undefined;

    if (parentId) {
      if (String(parentId) === String(resolvedParams.id)) {
        return NextResponse.json({ error: 'Uma categoria não pode ser sua própria categoria pai' }, { status: 400 });
      }
      
      const descendants = getAllDescendantIds(String(resolvedParams.id), allCategories);
      if (descendants.includes(String(parentId))) {
        return NextResponse.json({ error: 'Não é possível definir uma categoria descendente como pai' }, { status: 400 });
      }
      
      const parent = allCategories.find(c => String(c.id) === String(parentId));
      if (!parent) {
        return NextResponse.json({ error: `Categoria pai não encontrada (ID: ${parentId})` }, { status: 400 });
      }
    }
    
    let updated;
    const updateData = {
      ...data,
      parentId: parentId
    };

    const categoryId = String(resolvedParams.id);
    if (postgresAvailable) {
      updated = await dbPostgres.categories.update(categoryId, updateData);
    } else {
      updated = db.categories.update(categoryId, updateData);
    }
    
    if (!updated) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Falha ao atualizar categoria' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const postgresAvailable = isPostgresAvailable();
    let allCategories: Category[];
    
    if (postgresAvailable) {
      allCategories = await dbPostgres.categories.getAll();
    } else {
      allCategories = db.categories.getAll();
    }
    
    const categoryId = String(resolvedParams.id);
    console.log(`[Categories API] DELETE request for category ID: ${categoryId}`);
    
    const category = allCategories.find(c => String(c.id) === categoryId);
    if (!category) {
      console.error(`[Categories API] Category not found: ${categoryId}`);
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }
    
    const descendants = getAllDescendantIds(categoryId, allCategories);
    const idsToCheck = [categoryId, ...descendants];
    
    // Check if any product is using these categories
    let allProducts: Product[];
    if (postgresAvailable) {
      allProducts = await dbPostgres.products.getAll();
    } else {
      allProducts = db.products.getAll();
    }
    
    const productsUsingCategory = allProducts.filter(p => 
      idsToCheck.includes(String(p.categoryId)) || 
      (p.subcategoryId && idsToCheck.includes(String(p.subcategoryId)))
    );
    
    if (productsUsingCategory.length > 0) {
      return NextResponse.json({ 
        error: `Não é possível excluir a categoria "${category.name}" pois existem ${productsUsingCategory.length} produtos vinculados a ela ou às suas subcategorias. Remova ou altere os produtos primeiro.` 
      }, { status: 400 });
    }
    
    console.log(`[Categories API] Deleting category ${categoryId} and ${descendants.length} descendants`);
    
    if (postgresAvailable) {
      for (const id of idsToCheck) {
        await dbPostgres.categories.delete(id);
      }
    } else {
      idsToDelete.forEach(id => {
        db.categories.delete(id);
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: idsToCheck.length,
      message: idsToCheck.length > 1 
        ? `Categoria e ${idsToCheck.length - 1} subcategorias excluídas`
        : 'Categoria excluída'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Falha ao excluir categoria' }, { status: 500 });
  }
}
