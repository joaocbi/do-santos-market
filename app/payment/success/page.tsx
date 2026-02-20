'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => setOrder(data))
        .catch(console.error);
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pagamento Aprovado!</h1>
            <p className="text-gray-600">
              Seu pagamento foi confirmado com sucesso.
            </p>
          </div>

          {order && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h2 className="font-semibold mb-4">Detalhes do Pedido</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número do Pedido:</span>
                  <span className="font-semibold">#{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-green-600">Pagamento Aprovado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(order.total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-gray-700">
              Você receberá um e-mail de confirmação em breve. O vendedor foi notificado e seu pedido será preparado.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                Continuar Comprando
              </Link>
              {orderId && (
                <Link
                  href={`/orders/${orderId}`}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Ver Pedido
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <p>Carregando...</p>
          </div>
        </main>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
