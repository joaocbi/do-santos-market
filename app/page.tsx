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

  useEffect(() => {
    fetch('/api/products?featured=true')
      .then(res => res.json())
      .then(data => setFeaturedProducts(data))
      .catch(console.error);

    fetch('/api/products')
      .then(res => res.json())
      .then(data => setAllProducts(data.slice(0, 12)))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <BannerSlider />
      
      <main className="container mx-auto px-4 py-8">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <VideoSection />
      </main>

      <WhatsAppButton />
      <Footer />
    </div>
  );
}
