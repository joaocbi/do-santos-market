'use client';

import { useState, useEffect } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import { SiteConfig } from '@/lib/types';

export default function WhatsAppButton() {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(console.error);
  }, []);

  if (!config?.whatsappNumber) return null;

  const whatsappUrl = `https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition z-50 flex items-center gap-2"
    >
      <FiMessageCircle size={24} />
      <span className="hidden md:inline">WhatsApp</span>
    </a>
  );
}
