'use client';

import { useState, useEffect } from 'react';
import { FiX, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { Category } from '@/lib/types';
import toast from 'react-hot-toast';

interface CategoryModalProps {
  onClose: () => void;
}

export default function CategoryModal({ onClose }: CategoryModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentId: '',
    image: '',
    order: 0,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      toast.error('Falha ao carregar categorias');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/categories/${editing.id}` : '/api/categories';
      const method = editing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editing ? 'Categoria atualizada' : 'Categoria criada');
        loadCategories();
        resetForm();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Falha ao salvar categoria');
      }
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    }
  };

  const findCategoryInTree = (id: string, cats: Category[]): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.subcategories) {
        const found = findCategoryInTree(id, cat.subcategories);
        if (found) return found;
      }
    }
    return null;
  };

  const handleDelete = async (id: string) => {
    const category = findCategoryInTree(id, categories);
    const hasSubcategories = category?.subcategories && category.subcategories.length > 0;
    
    if (hasSubcategories) {
      if (!confirm('Esta categoria possui subcategorias. Excluí-la também excluirá todas as subcategorias. Continuar?')) {
        return;
      }
    } else {
      if (!confirm('Excluir esta categoria?')) return;
    }
    
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Categoria excluída');
        loadCategories();
        if (editing?.id === id) {
          resetForm();
        }
      } else {
        toast.error('Falha ao excluir categoria');
      }
    } catch (error) {
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleEdit = (category: Category) => {
    setEditing(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId || '',
      image: category.image || '',
      order: category.order,
    });
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({ name: '', slug: '', parentId: '', image: '', order: 0 });
  };

  const flattenCategories = (cats: Category[], level = 0, excludeId?: string): Category[] => {
    let result: Category[] = [];
    cats.forEach(cat => {
      if (cat.id === excludeId) return;
      result.push({ ...cat, name: '  '.repeat(level) + cat.name });
      if (cat.subcategories) {
        result = result.concat(flattenCategories(cat.subcategories, level + 1, excludeId));
      }
    });
    return result;
  };

  const getAllDescendantIds = (categoryId: string, cats: Category[]): string[] => {
    const descendants: string[] = [];
    const findDescendants = (parentId: string, categories: Category[]) => {
      categories.forEach(cat => {
        if (cat.parentId === parentId) {
          descendants.push(cat.id);
          if (cat.subcategories) {
            findDescendants(cat.id, cat.subcategories);
          }
        }
      });
    };
    findDescendants(categoryId, cats);
    return descendants;
  };

  const getAvailableParents = (): Category[] => {
    if (!editing) {
      return flattenCategories(categories);
    }
    const excludedIds = [editing.id, ...getAllDescendantIds(editing.id, categories)];
    return flattenCategories(categories).filter(cat => !excludedIds.includes(cat.id));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Gerenciar Categorias</h2>
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
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="gerado automaticamente do nome"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoria Pai</label>
              <select
                value={formData.parentId}
                onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Nenhuma</option>
                {getAvailableParents().map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL da Imagem</label>
              <input
                type="url"
                value={formData.image}
                onChange={e => setFormData({ ...formData, image: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ordem</label>
              <input
                type="number"
                value={formData.order}
                onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full border rounded px-3 py-2"
                min="0"
              />
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
            <h3 className="font-bold">Categorias</h3>
            {categories.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhuma categoria ainda. Crie uma acima.</p>
            ) : (
              flattenCategories(categories).map(category => {
                const isSubcategory = category.parentId && category.parentId !== '';
                return (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between p-3 rounded ${
                      isSubcategory ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSubcategory && (
                        <span className="text-blue-600 text-xs font-semibold">SUB</span>
                      )}
                      <span className={isSubcategory ? 'text-gray-700' : 'text-gray-900'}>
                        {category.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar categoria"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Excluir categoria"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
