'use client';

import Link from 'next/link';
import { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Link href={`/product/${product.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
        <div className="relative w-full h-64 overflow-hidden bg-gray-100 flex items-center justify-center">
          <img
            src={product.images[0] || '/placeholder.jpg'}
            alt={product.name}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
            style={{ imageRendering: 'auto' }}
            loading="lazy"
          />
          {product.originalPrice && (
            <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% DESCONTO
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-gray-500 line-through text-sm">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {product.stock === 0 && (
            <span className="text-red-500 text-sm mt-2 block">Fora de estoque</span>
          )}
        </div>
      </div>
    </Link>
  );
}
