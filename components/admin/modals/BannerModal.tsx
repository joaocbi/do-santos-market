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
  const [dragActive, setDragActive] = useState(false);
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

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter menos de 5MB');
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
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFile(files[0]);
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (uploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
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
              <label className="block text-sm font-medium mb-2">Imagem do Banner</label>
              
              {!formData.image ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-primary'
                  } ${uploading ? 'opacity-50' : ''}`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    id="banner-image-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="banner-image-upload"
                    className={`cursor-pointer flex flex-col items-center ${uploading ? 'cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2"></div>
                        <p className="text-sm text-gray-600">Enviando imagem...</p>
                      </>
                    ) : (
                      <>
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {dragActive ? 'Solte a imagem aqui' : 'Clique para fazer upload ou arraste a imagem aqui'}
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF até 5MB</p>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative border rounded-lg overflow-hidden bg-gray-50">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-full max-h-64 object-contain mx-auto" 
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      title="Remover imagem"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Imagem carregada com sucesso</span>
                    <label className="text-primary hover:text-primary/80 cursor-pointer">
                      Trocar imagem
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
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
