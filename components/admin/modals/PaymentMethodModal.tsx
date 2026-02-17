'use client';

import { useState, useEffect } from 'react';
import { FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import { PaymentMethod } from '@/lib/types';
import toast from 'react-hot-toast';

interface PaymentMethodModalProps {
  onClose: () => void;
}

export default function PaymentMethodModal({ onClose }: PaymentMethodModalProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'credit' as PaymentMethod['type'],
    active: true,
    installments: '',
    fee: '',
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      const res = await fetch('/api/payment-methods');
      const data = await res.json();
      setMethods(data);
    } catch (error) {
      toast.error('Failed to load payment methods');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/payment-methods/${editing.id}` : '/api/payment-methods';
      const method = editing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          installments: formData.installments ? parseInt(formData.installments) : undefined,
          fee: formData.fee ? parseFloat(formData.fee) : undefined,
        }),
      });

      if (res.ok) {
        toast.success(editing ? 'Forma de pagamento atualizada' : 'Forma de pagamento criada');
        loadMethods();
        resetForm();
      } else {
        toast.error('Failed to save payment method');
      }
    } catch (error) {
      toast.error('Error saving payment method');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta forma de pagamento?')) return;
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Forma de pagamento excluída');
        loadMethods();
      } else {
        toast.error('Failed to delete payment method');
      }
    } catch (error) {
      toast.error('Error deleting payment method');
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditing(method);
    setFormData({
      name: method.name,
      type: method.type,
      active: method.active,
      installments: method.installments?.toString() || '',
      fee: method.fee?.toString() || '',
    });
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({ name: '', type: 'credit', active: true, installments: '', fee: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Gerenciar Formas de Pagamento</h2>
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
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as PaymentMethod['type'] })}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="credit">Cartão de Crédito</option>
                <option value="debit">Cartão de Débito</option>
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Parcelas Máximas</label>
                <input
                  type="number"
                  value={formData.installments}
                  onChange={e => setFormData({ ...formData, installments: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Taxa (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fee}
                  onChange={e => setFormData({ ...formData, fee: e.target.value })}
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
            <h3 className="font-bold">Formas de Pagamento</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {methods.map(method => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-medium">{method.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({method.type})</span>
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
