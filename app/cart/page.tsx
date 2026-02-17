'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import WhatsAppButton from '@/components/WhatsAppButton';
import { cartUtils, CartItem } from '@/lib/cart';
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCart = () => {
      setCartItems(cartUtils.getCart());
      setIsLoading(false);
    };

    loadCart();
    window.addEventListener('cartUpdated', loadCart);

    return () => {
      window.removeEventListener('cartUpdated', loadCart);
    };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleRemoveItem = (productId: string) => {
    if (confirm('Remover este item do carrinho?')) {
      cartUtils.removeFromCart(productId);
      setCartItems(cartUtils.getCart());
    }
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
    } else {
      cartUtils.updateQuantity(productId, newQuantity);
      setCartItems(cartUtils.getCart());
    }
  };

  const subtotal = cartUtils.getCartTotal();
  const shippingFee = subtotal < 300 ? 20 : 0;
  const total = subtotal + shippingFee;

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Carrinho de Compras</h1>
            <p className="text-gray-600 mb-8">Seu carrinho está vazio</p>
            <Link
              href="/"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Continuar Comprando
            </Link>
          </div>
        </main>
        <WhatsAppButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Carrinho de Compras</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex gap-4 pb-6 mb-6 border-b last:border-b-0 last:pb-0 last:mb-0">
                  <Link href={`/product/${item.productId}`} className="flex-shrink-0">
                    <img
                      src={item.product.images[0] || '/placeholder.jpg'}
                      alt={item.product.name}
                      className="w-24 h-24 object-contain rounded bg-gray-100"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link href={`/product/${item.productId}`}>
                      <h3 className="font-semibold text-lg mb-2 hover:text-primary transition">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-2">SKU: {item.product.sku}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 rounded hover:bg-gray-100 transition"
                          disabled={item.quantity <= 1}
                        >
                          <FiMinus size={16} />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 rounded hover:bg-gray-100 transition"
                          disabled={item.quantity >= item.product.stock}
                        >
                          <FiPlus size={16} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-gray-500">
                            {formatPrice(item.product.price)} cada
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded transition"
                    title="Remover item"
                  >
                    <FiTrash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span className="font-semibold">
                    {shippingFee > 0 ? formatPrice(shippingFee) : 'Grátis'}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Total:</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>
              
              {subtotal < 300 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Frete Grátis:</strong> Adicione mais {formatPrice(300 - subtotal)} em produtos para ganhar frete grátis em compras acima de R$ 300,00!
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800">
                    <strong>✓ Frete Grátis:</strong> Você ganhou frete grátis nesta compra!
                  </p>
                </div>
              )}
              
              <button
                onClick={handleCheckout}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition mb-4"
              >
                Finalizar Compra
              </button>
              <Link
                href="/"
                className="block w-full text-center text-gray-600 hover:text-primary transition"
              >
                Continuar Comprando
              </Link>
            </div>
          </div>
        </div>
      </main>
      <WhatsAppButton />
    </div>
  );
}
