'use client';

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { SiteConfig } from '@/lib/types';
import toast from 'react-hot-toast';

interface ConfigModalProps {
  onClose: () => void;
}

export default function ConfigModal({ onClose }: ConfigModalProps) {
  const [formData, setFormData] = useState<SiteConfig>({
    whatsappNumber: '',
    email: '',
    socialMedia: {},
    mercadoPagoAccessToken: '',
    mercadoPagoPublicKey: '',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setFormData(data);
    } catch (error) {
      toast.error('Failed to load config');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Settings updated');
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      toast.error('Error updating settings');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Configurações do Site</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Número do WhatsApp</label>
              <input
                type="tel"
                value={formData.whatsappNumber}
                onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="5511999999999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">Mercado Pago - Pagamento Online</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Access Token (Obrigatório)
                  </label>
                  <input
                    type="password"
                    value={formData.mercadoPagoAccessToken || ''}
                    onChange={e => setFormData({ 
                      ...formData, 
                      mercadoPagoAccessToken: e.target.value 
                    })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="APP_USR-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Token de acesso do Mercado Pago. Encontre em: Credenciais → Access Token
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Public Key (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.mercadoPagoPublicKey || ''}
                    onChange={e => setFormData({ 
                      ...formData, 
                      mercadoPagoPublicKey: e.target.value 
                    })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="APP_USR-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Chave pública do Mercado Pago (para uso no frontend, se necessário)
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Como obter as credenciais:</strong>
                  </p>
                  <ol className="text-xs text-blue-700 mt-2 ml-4 list-decimal space-y-1">
                    <li>Acesse <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="underline">Mercado Pago Developers</a></li>
                    <li>Faça login na sua conta</li>
                    <li>Vá em "Suas integrações" → "Credenciais"</li>
                    <li>Copie o "Access Token" (produção ou teste)</li>
                    <li className="mt-2">
                      <strong>Configure o webhook no Mercado Pago:</strong>
                      <div className="mt-1 bg-white p-2 rounded border">
                        <code className="text-xs break-all">
                          {typeof window !== 'undefined' 
                            ? `${window.location.origin}/api/payment/webhook`
                            : 'https://seu-dominio.com.br/api/payment/webhook'}
                        </code>
                      </div>
                      <p className="mt-1 text-xs">
                        ⚠️ <strong>Importante:</strong> Substitua "seu-dominio.com.br" pela URL real do seu site (ex: dosantosmarket.com.br)
                      </p>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Redes Sociais</label>
              <div className="space-y-2">
                <input
                  type="url"
                  value={formData.socialMedia.instagram || ''}
                  onChange={e => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, instagram: e.target.value },
                  })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Instagram URL"
                />
                <input
                  type="url"
                  value={formData.socialMedia.facebook || ''}
                  onChange={e => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, facebook: e.target.value },
                  })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Facebook URL"
                />
                <input
                  type="url"
                  value={formData.socialMedia.twitter || ''}
                  onChange={e => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, twitter: e.target.value },
                  })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Twitter URL"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
              >
                Salvar Configurações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
