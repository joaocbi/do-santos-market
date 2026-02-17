'use client';

import { useState, useEffect } from 'react';
import { FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import { DeliveryMethod } from '@/lib/types';
import toast from 'react-hot-toast';

interface DeliveryMethodModalProps {
  onClose: () => void;
}

export default function DeliveryMethodModal({ onClose }: DeliveryMethodModalProps) {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [editing, setEditing] = useState<DeliveryMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    estimatedDays: '1',
    active: true,
    freeShippingThreshold: '',
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      const res = await fetch('/api/delivery-methods');
      const data = await res.json();
      setMethods(data);
    } catch (error) {
      toast.error('Failed to load delivery methods');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/delivery-methods/${editing.id}` : '/api/delivery-methods';
      const method = editing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          estimatedDays: parseInt(formData.estimatedDays),
          freeShippingThreshold: formData.freeShippingThreshold ? parseFloat(formData.freeShippingThreshold) : undefined,
        }),
      });

      if (res.ok) {
        toast.success(editing ? 'Delivery method updated' : 'Delivery method created');
        loadMethods();
        resetForm();
      } else {
        toast.error('Failed to save delivery method');
      }
    } catch (error) {
      toast.error('Error saving delivery method');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this delivery method?')) return;
    try {
      const res = await fetch(`/api/delivery-methods/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Delivery method deleted');
        loadMethods();
      } else {
        toast.error('Failed to delete delivery method');
      }
    } catch (error) {
      toast.error('Error deleting delivery method');
    }
  };

  const handleEdit = (method: DeliveryMethod) => {
    setEditing(method);
    setFormData({
      name: method.name,
      price: method.price.toString(),
      estimatedDays: method.estimatedDays.toString(),
      active: method.active,
      freeShippingThreshold: method.freeShippingThreshold?.toString() || '',
    });
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({ name: '', price: '', estimatedDays: '1', active: true, freeShippingThreshold: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Gerenciar Formas de Entrega</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Preço</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dias Estimados</label>
                <input
                  type="number"
                  value={formData.estimatedDays}
                  onChange={e => setFormData({ ...formData, estimatedDays: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor para Frete Grátis</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.freeShippingThreshold}
                  onChange={e => setFormData({ ...formData, freeShippingThreshold: e.target.value })}
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
            <h3 className="font-bold">Formas de Entrega</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {methods.map(method => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-medium">{method.name}</span>
                    <span className="text-sm text-gray-500 ml-2">R$ {method.price.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(method)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(method.id)}
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
