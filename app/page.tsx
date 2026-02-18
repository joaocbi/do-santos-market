'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BannerSlider from '@/components/BannerSlider';
import ProductCard from '@/components/ProductCard';
import WhatsAppButton from '@/components/WhatsAppButton';
import Footer from '@/components/Footer';
import VideoSection from '@/components/VideoSection';
import { Product } from '@/lib/types';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        
        const [featuredRes, allRes] = await Promise.all([
          fetch('/api/products?featured=true'),
          fetch('/api/products')
        ]);

        if (featuredRes.ok) {
          const featuredData = await featuredRes.json();
          setFeaturedProducts(featuredData);
        }

        if (allRes.ok) {
          const allData = await allRes.json();
          setAllProducts(allData.slice(0, 12));
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <BannerSlider />
      
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Carregando produtos...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Featured Products */}
            {featuredProducts.length > 0 && (
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-6">Produtos em Destaque</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {featuredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {/* All Products */}
            <section>
              <h2 className="text-3xl font-bold mb-6">Todos os Produtos</h2>
              {allProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {allProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">Nenhum produto encontrado.</p>
              )}
            </section>

            <VideoSection />
          </>
        )}
      </main>

      <WhatsAppButton />
      <Footer />
    </div>
  );
}
