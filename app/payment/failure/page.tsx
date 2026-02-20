'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pagamento Não Aprovado</h1>
            <p className="text-gray-600">
              O pagamento não foi processado. Tente novamente ou escolha outro método de pagamento.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 justify-center">
              <Link
                href="/checkout"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                Tentar Novamente
              </Link>
              <Link
                href="/"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Voltar ao Início
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentFailurePage() {
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
      <PaymentFailureContent />
    </Suspense>
  );
}
