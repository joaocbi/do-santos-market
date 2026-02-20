'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import WhatsAppButton from '@/components/WhatsAppButton';
import Link from 'next/link';
import { FiUser, FiShoppingBag, FiHeart, FiSettings } from 'react-icons/fi';

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Minha Conta</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p className="text-gray-600 mb-4">
            Esta funcionalidade está em desenvolvimento.
          </p>
          <div className="space-y-3">
            <Link 
              href="/cart" 
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <FiShoppingBag size={24} />
              <div>
                <div className="font-semibold">Meus Pedidos</div>
                <div className="text-sm text-gray-600">Visualize seus pedidos</div>
              </div>
            </Link>
            <div className="flex items-center gap-3 p-4 border rounded-lg opacity-50">
              <FiHeart size={24} />
              <div>
                <div className="font-semibold">Favoritos</div>
                <div className="text-sm text-gray-600">Em breve</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg opacity-50">
              <FiSettings size={24} />
              <div>
                <div className="font-semibold">Configurações</div>
                <div className="text-sm text-gray-600">Em breve</div>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="inline-block text-primary hover:underline"
        >
          ← Voltar para a loja
        </Link>
      </main>
      <WhatsAppButton />
    </div>
  );
}
