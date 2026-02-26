import { NextRequest, NextResponse } from 'next/server';
import { db, dbPostgres, isPostgresAvailable } from '@/lib/db';
import { Product, Category } from '@/lib/types';
import { autoCommit } from '@/lib/gitAutoCommit';

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
      const normalizedCategoryId = String(categoryId);
      
      // Get all categories to find descendants
      let allCategories: Category[];
      if (isPostgresAvailable()) {
        allCategories = await dbPostgres.categories.getAll();
      } else {
        allCategories = db.categories.getAll();
      }
      
      // Get all descendant category IDs (subcategories)
      const descendantIds = getAllDescendantIds(normalizedCategoryId, allCategories);
      const allCategoryIds = [normalizedCategoryId, ...descendantIds];
      
      console.log(`[Products API] Filtering by categoryId: ${normalizedCategoryId}`);
      console.log(`[Products API] Including ${descendantIds.length} subcategories:`, descendantIds);
      
      products = products.filter(p => {
        const productCategoryId = String(p.categoryId);
        const productSubcategoryId = p.subcategoryId ? String(p.subcategoryId) : null;
        
        return allCategoryIds.includes(productCategoryId) || 
               (productSubcategoryId && allCategoryIds.includes(productSubcategoryId));
      });
      
      console.log(`[Products API] Found ${products.length} products`);
    }
    
    if (featured === 'true') {
      products = products.filter(p => p.featured);
    }
    
    // Filter out inactive products (unless specifically requested)
    products = products.filter(p => p.active !== false);
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Falha ao buscar produtos' }, { status: 500 });
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
    return NextResponse.json({ error: 'Falha ao criar produto' }, { status: 500 });
  }
}
