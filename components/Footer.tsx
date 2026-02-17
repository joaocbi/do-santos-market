'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteConfig } from '@/lib/types';
import { FiInstagram, FiFacebook, FiTwitter } from 'react-icons/fi';

export default function Footer() {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(console.error);
  }, []);

  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Do Santos Market</h3>
            <p className="text-gray-400">Sua plataforma de e-commerce confiável</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/" className="hover:text-white">Início</Link></li>
              <li><Link href="/about" className="hover:text-white">Sobre</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contato</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-2 text-gray-400">
              {config?.email && <li>Email: {config.email}</li>}
              {config?.whatsappNumber && <li>WhatsApp: {config.whatsappNumber}</li>}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Siga-nos</h4>
            <div className="flex gap-4">
              {config?.socialMedia?.instagram && (
                <a href={config.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                  <FiInstagram size={24} className="hover:text-pink-500" />
                </a>
              )}
              {config?.socialMedia?.facebook && (
                <a href={config.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                  <FiFacebook size={24} className="hover:text-blue-500" />
                </a>
              )}
              {config?.socialMedia?.twitter && (
                <a href={config.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                  <FiTwitter size={24} className="hover:text-blue-400" />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Do Santos Market. Todos os direitos reservados.</p>
          <Link href="/admin" className="text-sm hover:text-white mt-2 inline-block">
            Painel Administrativo
          </Link>
        </div>
      </div>
    </footer>
  );
}
