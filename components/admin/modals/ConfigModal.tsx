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
