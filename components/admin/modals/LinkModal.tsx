'use client';

import { useState, useEffect } from 'react';
import { FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import { ClickableLink } from '@/lib/types';
import toast from 'react-hot-toast';

interface LinkModalProps {
  onClose: () => void;
}

export default function LinkModal({ onClose }: LinkModalProps) {
  const [links, setLinks] = useState<ClickableLink[]>([]);
  const [editing, setEditing] = useState<ClickableLink | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    icon: '',
    order: 0,
    active: true,
  });

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const res = await fetch('/api/links');
      const data = await res.json();
      setLinks(data);
    } catch (error) {
      toast.error('Failed to load links');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/links/${editing.id}` : '/api/links';
      const method = editing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editing ? 'Link updated' : 'Link created');
        loadLinks();
        resetForm();
      } else {
        toast.error('Failed to save link');
      }
    } catch (error) {
      toast.error('Error saving link');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this link?')) return;
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Link deleted');
        loadLinks();
      } else {
        toast.error('Failed to delete link');
      }
    } catch (error) {
      toast.error('Error deleting link');
    }
  };

  const handleEdit = (link: ClickableLink) => {
    setEditing(link);
    setFormData({
      title: link.title,
      url: link.url,
      icon: link.icon || '',
      order: link.order,
      active: link.active,
    });
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({ title: '', url: '', icon: '', order: 0, active: true });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Gerenciar Links</h2>
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
              <label className="block text-sm font-medium mb-1">URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ícone (opcional)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Nome do ícone ou URL"
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
            <h3 className="font-bold">Links</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {links.map(link => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-medium">{link.title}</span>
                    <span className="text-sm text-gray-500 ml-2">{link.url}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(link)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
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
