'use client';

import { useState, useEffect } from 'react';
import { FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import { GalleryImage } from '@/lib/types';
import toast from 'react-hot-toast';

interface GalleryModalProps {
  onClose: () => void;
}

export default function GalleryModal({ onClose }: GalleryModalProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    alt: '',
    order: 0,
    category: '',
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      setImages(data);
    } catch (error) {
      toast.error('Failed to load gallery');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/gallery/${editing.id}` : '/api/gallery';
      const method = editing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editing ? 'Image updated' : 'Image added');
        loadImages();
        resetForm();
      } else {
        toast.error('Failed to save image');
      }
    } catch (error) {
      toast.error('Error saving image');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Image deleted');
        loadImages();
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      toast.error('Error deleting image');
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setEditing(image);
    setFormData({
      url: image.url,
      alt: image.alt,
      order: image.order,
      category: image.category || '',
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate all files
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} não é uma imagem válida`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} é maior que 5MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    try {
      // Upload files sequentially
      for (const file of validFiles) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          const data = await res.json();

          if (res.ok && data.url) {
            uploadedUrls.push(data.url);
            successCount++;
          } else {
            const errorMessage = data.error || `Erro ${res.status}: ${res.statusText}`;
            console.error(`Upload error for ${file.name}:`, data);
            errorCount++;
          }
        } catch (error: any) {
          console.error(`Upload error for ${file.name}:`, error);
          errorCount++;
        }
      }

      // For gallery, we'll add each image separately
      if (uploadedUrls.length > 0) {
        // Save first image to form, and create entries for others
        setFormData({ ...formData, url: uploadedUrls[0] });
        
        // If multiple images, create gallery entries for the rest
        if (uploadedUrls.length > 1) {
          for (let i = 1; i < uploadedUrls.length; i++) {
            try {
              await fetch('/api/gallery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: uploadedUrls[i],
                  alt: '',
                  order: images.length + i,
                  category: formData.category,
                }),
              });
            } catch (error) {
              console.error('Error creating gallery entry:', error);
            }
          }
          loadImages(); // Reload to show new images
        }
        
        toast.success(`${successCount} imagem(ns) enviada(s) com sucesso${errorCount > 0 ? `, ${errorCount} falha(s)` : ''}`);
      } else {
        toast.error('Nenhuma imagem foi enviada com sucesso');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagens. Verifique o console para mais detalhes.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({ url: '', alt: '', order: 0, category: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Gerenciar Galeria</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Imagem</label>
              
              {/* Upload de arquivo local */}
              <div className="mb-2">
                <label className="block text-xs text-gray-600 mb-1">Enviar imagem(ns) do computador (múltiplas seleções permitidas):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  multiple
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer disabled:opacity-50"
                  required={!formData.url}
                />
                {uploading && <p className="text-xs text-gray-500 mt-1">Enviando imagens...</p>}
              </div>

              {/* Preview da imagem */}
              {formData.url && (
                <div className="mt-2">
                  <img src={formData.url} alt="Preview" className="w-full max-h-48 object-contain rounded bg-gray-100" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, url: '' })}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remover imagem
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Texto Alternativo</label>
              <input
                type="text"
                value={formData.alt}
                onChange={e => setFormData({ ...formData, alt: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
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
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
              >
                {editing ? 'Atualizar' : 'Adicionar'}
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
            <h3 className="font-bold">Imagens da Galeria</h3>
            <div className="grid grid-cols-3 gap-4">
              {images.map(image => (
                <div key={image.id} className="relative group">
                  <img src={image.url} alt={image.alt} className="w-full h-32 object-contain rounded bg-gray-100" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(image)}
                      className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
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
