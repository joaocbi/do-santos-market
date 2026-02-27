'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import WhatsAppButton from '@/components/WhatsAppButton';
import { Product, Category } from '@/lib/types';

export default function CategoryPage() {
  const params = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (params.slug) {
      setLoadingProducts(true);
      fetch('/api/categories')
        .then(res => res.json())
        .then((categories: Category[]) => {
          const findCategory = (cats: Category[]): Category | null => {
            for (const cat of cats) {
              if (cat.slug === params.slug) return cat;
              if (cat.subcategories) {
                const found = findCategory(cat.subcategories);
                if (found) return found;
              }
            }
            return null;
          };
          const found = findCategory(categories);
          setCategory(found);
          if (found) {
            const categoryId = String(found.id);
            console.log(`[CategoryPage] Fetching products for category: ${categoryId} (${found.name})`);
            fetch(`/api/products?categoryId=${categoryId}`)
              .then(res => res.json())
              .then(data => {
                console.log(`[CategoryPage] Received ${Array.isArray(data) ? data.length : 0} products`);
                if (Array.isArray(data)) {
                  setProducts(data);
                } else {
                  console.error('[CategoryPage] Invalid response format:', data);
                  setProducts([]);
                }
                setLoadingProducts(false);
              })
              .catch(err => {
                console.error('[CategoryPage] Error fetching products:', err);
                setLoadingProducts(false);
              });
          } else {
            console.log(`[CategoryPage] Category not found for slug: ${params.slug}`);
            setLoadingProducts(false);
          }
        })
        .catch(err => {
          console.error(err);
          setLoadingProducts(false);
        });
    }
  }, [params.slug]);

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{category.name}</h1>
        
        {loadingProducts ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {products.length === 0 && (
              <p className="text-center text-gray-500 py-12">Nenhum produto encontrado nesta categoria</p>
            )}
          </>
        )}
      </main>
      <WhatsAppButton />
    </div>
  );
}
