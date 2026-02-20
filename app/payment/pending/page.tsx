'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

export default function PaymentPendingPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-yellow-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pagamento em Análise</h1>
            <p className="text-gray-600">
              Seu pagamento está sendo processado. Você receberá uma confirmação por e-mail assim que for aprovado.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
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
