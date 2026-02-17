'use client';

import { useState, useEffect } from 'react';
import { FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import { Video } from '@/lib/types';
import toast from 'react-hot-toast';

interface VideoModalProps {
  onClose: () => void;
}

export default function VideoModal({ onClose }: VideoModalProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [editing, setEditing] = useState<Video | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    type: 'direct' as Video['type'],
    thumbnail: '',
    order: 0,
    active: true,
  });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      const data = await res.json();
      setVideos(data);
    } catch (error) {
      toast.error('Falha ao carregar vídeos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error('Por favor, preencha o título do vídeo');
      return;
    }
    
    if (!formData.url) {
      toast.error('Por favor, faça o upload de um vídeo');
      return;
    }
    
    try {
      const url = editing ? `/api/videos/${editing.id}` : '/api/videos';
      const method = editing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, type: 'direct' }),
      });

      if (res.ok) {
        toast.success(editing ? 'Vídeo atualizado' : 'Vídeo adicionado');
        loadVideos();
        resetForm();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || 'Falha ao salvar vídeo');
      }
    } catch (error) {
      console.error('Error saving video:', error);
      toast.error('Erro ao salvar vídeo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este vídeo?')) return;
    try {
      const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Vídeo excluído');
        loadVideos();
      } else {
        toast.error('Falha ao excluir vídeo');
      }
    } catch (error) {
      toast.error('Erro ao excluir vídeo');
    }
  };

  const handleEdit = (video: Video) => {
    setEditing(video);
    setFormData({
      title: video.title,
      url: video.url,
      type: video.type,
      thumbnail: video.thumbnail || '',
      order: video.order,
      active: video.active,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Por favor, selecione um arquivo de vídeo');
      e.target.value = '';
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('O vídeo deve ter menos de 50MB');
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
        setFormData({ 
          ...formData, 
          url: data.url,
          type: 'direct'
        });
        toast.success('Vídeo enviado com sucesso');
      } else {
        const errorMessage = data.error || `Erro ${res.status}: ${res.statusText}`;
        toast.error(errorMessage);
        console.error('Upload error:', data);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.message || 'Erro ao enviar vídeo. Verifique o console para mais detalhes.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({ title: '', url: '', type: 'direct', thumbnail: '', order: 0, active: true });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Gerenciar Vídeos</h2>
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
              <label className="block text-sm font-medium mb-1">Vídeo</label>
              
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <label className="bg-primary text-white px-6 py-3 rounded hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 font-medium">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    {uploading ? 'Enviando...' : 'Fazer Upload de Vídeo'}
                  </label>
                  {uploading && <span className="text-sm text-gray-500">Enviando vídeo...</span>}
                </div>
                {formData.url && (
                  <p className="text-xs text-green-600 mt-2">✓ Vídeo carregado com sucesso</p>
                )}
              </div>

              {/* Preview do vídeo */}
              {formData.url && (
                <div className="mt-2">
                  <video 
                    src={formData.url} 
                    controls 
                    className="w-full h-48 rounded"
                    preload="metadata"
                  >
                    Seu navegador não suporta a tag de vídeo.
                  </video>
                </div>
              )}
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
            <h3 className="font-bold">Vídeos</h3>
            <div className="grid grid-cols-2 gap-4">
              {videos.map(video => (
                <div key={video.id} className="relative group">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-32 object-cover rounded" />
                  ) : video.type === 'direct' && video.url ? (
                    <video 
                      src={video.url} 
                      className="w-full h-32 object-cover rounded"
                      preload="metadata"
                      muted
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                      Sem miniatura
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(video)}
                      className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                  <p className="mt-2 text-sm font-medium">{video.title}</p>
                  <p className="text-xs text-gray-500">{video.type === 'direct' ? 'Upload Local' : video.type === 'youtube' ? 'YouTube' : 'Vimeo'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
