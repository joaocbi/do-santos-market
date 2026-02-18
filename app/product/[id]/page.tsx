'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import WhatsAppButton from '@/components/WhatsAppButton';
import { Product } from '@/lib/types';
import { cartUtils } from '@/lib/cart';
import { normalizeImageUrl } from '@/lib/imageUtils';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [mediaItems, setMediaItems] = useState<Array<{ type: 'image' | 'video'; url: string }>>([]);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/products/${params.id}`)
        .then(res => res.json())
        .then(data => {
          setProduct(data);
          setSelectedImage(0);
          
          // Combine images and video into media items
          const items: Array<{ type: 'image' | 'video'; url: string }> = [];
          
          // Add video first if exists and is not empty
          if (data.video && data.video.trim() !== '') {
            const normalizedVideoUrl = normalizeImageUrl(data.video);
            if (normalizedVideoUrl) {
              items.push({ type: 'video', url: normalizedVideoUrl });
            }
          }
          
          // Add images
          if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            data.images.forEach((img: string) => {
              if (img && img.trim() !== '') {
                const normalizedUrl = normalizeImageUrl(img);
                if (normalizedUrl) {
                  items.push({ type: 'image', url: normalizedUrl });
                }
              }
            });
          }
          
          setMediaItems(items);
          
          // Reset selected image if needed
          if (items.length > 0 && selectedImage >= items.length) {
            setSelectedImage(0);
          } else if (items.length === 0) {
            setSelectedImage(0);
          }
        })
        .catch(console.error);
    }
  }, [params.id]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    
    setIsAdding(true);
    cartUtils.addToCart(product, 1);
    
    setTimeout(() => {
      setIsAdding(false);
      const confirmGoToCart = confirm('Produto adicionado ao carrinho! Deseja ir para o carrinho?');
      if (confirmGoToCart) {
        router.push('/cart');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="mb-4 bg-white rounded-lg flex items-center justify-center p-4">
              {mediaItems.length > 0 ? (
                mediaItems[selectedImage].type === 'video' ? (
                  <video
                    src={mediaItems[selectedImage].url}
                    controls
                    className="w-full h-auto rounded-lg"
                    preload="metadata"
                  >
                    Seu navegador não suporta a tag de vídeo.
                  </video>
                ) : (
                  <img
                    src={normalizeImageUrl(mediaItems[selectedImage].url)}
                    alt={product.name}
                    className="rounded-lg"
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto',
                      width: 'auto',
                      maxHeight: '80vh'
                    }}
                    loading="eager"
                    decoding="async"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                )
              ) : (
                <img
                  src="/placeholder.jpg"
                  alt={product.name}
                  className="w-full h-auto rounded-lg"
                />
              )}
            </div>
            {mediaItems.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {mediaItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded ${
                      selectedImage === index ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    {item.type === 'video' ? (
                      <video 
                        src={item.url} 
                        className="w-full h-full object-cover rounded bg-gray-100" 
                        preload="metadata"
                        muted
                      />
                    ) : (
                      <img 
                        src={normalizeImageUrl(item.url)} 
                        alt={`${product.name} ${index + 1}`} 
                        className="w-full h-full object-contain rounded bg-gray-100 product-image-zoom" 
                        loading="lazy"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <div className="mb-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">SKU: {product.sku}</p>
              <p className="text-sm text-gray-600">
                Estoque: {product.stock > 0 ? `${product.stock} disponíveis` : 'Fora de estoque'}
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAdding}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                product.stock > 0 && !isAdding
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAdding ? 'Adicionando...' : product.stock > 0 ? 'Adicionar ao Carrinho' : 'Fora de Estoque'}
            </button>
          </div>
        </div>
      </main>
      <WhatsAppButton />
    </div>
  );
}
