'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import WhatsAppButton from '@/components/WhatsAppButton';
import Link from 'next/link';
import { SiteConfig } from '@/lib/types';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function ContactPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(console.error);
  }, []);

  const formatWhatsAppNumber = (number: string) => {
    const clean = number.replace(/\D/g, '');
    if (clean.startsWith('55')) {
      return `+${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 9)}-${clean.slice(9)}`;
    }
    return number;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Entre em Contato</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Informações de Contato</h2>
            <div className="space-y-4">
              {config?.email && (
                <div className="flex items-start gap-3">
                  <FiMail size={24} className="text-primary mt-1" />
                  <div>
                    <div className="font-semibold">Email</div>
                    <a 
                      href={`mailto:${config.email}`}
                      className="text-primary hover:underline"
                    >
                      {config.email}
                    </a>
                  </div>
                </div>
              )}
              {config?.whatsappNumber && (
                <div className="flex items-start gap-3">
                  <FiPhone size={24} className="text-primary mt-1" />
                  <div>
                    <div className="font-semibold">WhatsApp</div>
                    <a
                      href={`https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {formatWhatsAppNumber(config.whatsappNumber)}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {config?.socialMedia && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Redes Sociais</h3>
                <div className="flex gap-4">
                  {config.socialMedia.instagram && (
                    <a
                      href={config.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Instagram
                    </a>
                  )}
                  {config.socialMedia.facebook && (
                    <a
                      href={config.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Horário de Atendimento</h2>
            <p className="text-gray-600 mb-4">
              Estamos disponíveis para atendimento via WhatsApp de segunda a sexta, das 8h às 18h.
            </p>
            <p className="text-gray-600">
              Para dúvidas sobre produtos, pedidos ou suporte, entre em contato através do WhatsApp.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-block text-primary hover:underline"
          >
            ← Voltar para a loja
          </Link>
        </div>
      </main>
      <WhatsAppButton />
    </div>
  );
}
