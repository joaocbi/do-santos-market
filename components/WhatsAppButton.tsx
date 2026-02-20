'use client';

import { useState, useEffect } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import { SiteConfig } from '@/lib/types';

export default function WhatsAppButton() {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        console.log('WhatsAppButton - Config loaded:', data);
        if (data?.whatsappNumber) {
          const cleanNumber = data.whatsappNumber.replace(/\D/g, '');
          console.log('WhatsAppButton - Cleaned number:', cleanNumber);
          // Accept both formats: with country code (5542991628586) or without (42991628586)
          const isValidNumber = cleanNumber === '5542991628586' || cleanNumber === '42991628586';
          if (!isValidNumber) {
            console.warn('WhatsAppButton - Number format may be incorrect. Expected 5542991628586 or 42991628586, got:', cleanNumber);
          }
        }
        setConfig(data);
      })
      .catch(console.error);
  }, []);

  if (!config?.whatsappNumber) return null;

  const cleanNumber = config.whatsappNumber.replace(/\D/g, '');
  
  // Force correct number with country code 55
  let whatsappNumber = '5542991628586';
  
  if (cleanNumber === '5542991628586') {
    whatsappNumber = cleanNumber;
  } else if (cleanNumber === '42991628586') {
    // Add country code if missing
    whatsappNumber = '5542991628586';
    console.log('WhatsAppButton - Added country code 55');
  } else {
    console.error('WhatsAppButton - Wrong number detected:', cleanNumber, '- Using correct number with country code');
  }
  
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

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
