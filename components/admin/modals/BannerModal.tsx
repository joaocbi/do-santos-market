'use client';

import { useState, useEffect } from 'react';
import { FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import { Banner } from '@/lib/types';
import toast from 'react-hot-toast';

interface BannerModalProps {
  onClose: () => void;
}

export default function BannerModal({ onClose }: BannerModalProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    link: '',
    order: 0,
    active: true,
    position: 'home' as Banner['position'],
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      setBanners(data);
    } catch (error) {
      toast.error('Failed to load banners');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/banners/${editing.id}` : '/api/banners';
      const method = editing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editing ? 'Banner updated' : 'Banner created');
        loadBanners();
        resetForm();
      } else {
        toast.error('Failed to save banner');
      }
    } catch (error) {
      toast.error('Error saving banner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Banner deleted');
        loadBanners();
      } else {
        toast.error('Failed to delete banner');
      }
    } catch (error) {
      toast.error('Error deleting banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditing(banner);
    setFormData({
      title: banner.title,
      image: banner.image,
      link: banner.link || '',
      order: banner.order,
      active: banner.active,
      position: banner.position,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // For banners, we'll use the first image
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter menos de 5MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        setFormData({ ...formData, image: data.url });
        toast.success('Imagem enviada com sucesso');
        
        // If multiple files selected, inform user
        if (files.length > 1) {
          toast(`Apenas a primeira imagem foi usada. ${files.length - 1} outra(s) foram ignorada(s).`);
        }
      } else {
        const errorMessage = data.error || `Erro ${res.status}: ${res.statusText}`;
        toast.error(errorMessage);
        console.error('Upload error:', data);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.message || 'Erro ao enviar imagem. Verifique o console para mais detalhes.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({ title: '', image: '', link: '', order: 0, active: true, position: 'home' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Gerenciar Banners</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Título</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Imagem</label>
              
              {/* Upload de arquivo local */}
              <div className="mb-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer disabled:opacity-50"
                  required={!formData.image}
                />
                {uploading && <p className="text-xs text-gray-500 mt-1">Enviando...</p>}
              </div>

              {/* Preview da imagem */}
              {formData.image && (
                <div className="mt-2">
                  <img src={formData.image} alt="Preview" className="w-full max-h-48 object-contain rounded bg-gray-100" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remover imagem
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Link (opcional)</label>
              <input
                type="url"
                value={formData.link}
                onChange={e => setFormData({ ...formData, link: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Posição</label>
                <select
                  value={formData.position}
                  onChange={e => setFormData({ ...formData, position: e.target.value as Banner['position'] })}
                  className="w-full border rounded px-3 py-2"
                >
                <option value="home">Início</option>
                <option value="category">Categoria</option>
                <option value="product">Produto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ordem</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                />
                Ativo
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
              >
                {editing ? 'Atualizar' : 'Criar'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="space-y-2">
            <h3 className="font-bold">Banners</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {banners.map(banner => (
                <div
                  key={banner.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-3">
                    <img src={banner.image} alt={banner.title} className="w-16 h-16 object-contain rounded bg-gray-100" />
                    <div>
                      <span className="font-medium">{banner.title}</span>
                      <span className="text-sm text-gray-500 ml-2">({banner.position})</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
