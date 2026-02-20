'use client';

import Link from 'next/link';
import { Product } from '@/lib/types';
import { normalizeImageUrl } from '@/lib/imageUtils';

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

  const imageUrl = normalizeImageUrl(product.images?.[0]);
  const hasImage = imageUrl && imageUrl !== '/placeholder.jpg';

  return (
    <Link href={`/product/${product.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
        <div className="relative w-full h-64 overflow-hidden bg-gray-100 flex items-center justify-center">
          {hasImage ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
              style={{ imageRendering: 'auto' }}
              loading="lazy"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-sm p-4 text-center"
            style={{ display: product.images && product.images[0] ? 'none' : 'flex' }}
          >
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs line-clamp-2">{product.name}</span>
          </div>
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
        </div>
      </div>
    </Link>
  );
}
