'use client';

import { useState, useEffect } from 'react';
import { FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import { Product, Category } from '@/lib/types';
import toast from 'react-hot-toast';

interface ProductModalProps {
  onClose: () => void;
}

export default function ProductModal({ onClose }: ProductModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
    return numPrice.toFixed(2);
  };
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    costPrice: '',
    salePercentage: '',
    images: [] as string[],
    video: '',
    categoryId: '',
    subcategoryId: '',
    sku: '',
    stock: '',
    active: true,
    featured: false,
    observations: '',
  });
  const [imageInput, setImageInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error('Falha ao carregar produtos');
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Gera SKU automaticamente se estiver vazio (apenas para novos produtos)
    const { salePercentage, ...submitData } = formData;
    if (!editing && !submitData.sku.trim()) {
      submitData.sku = generateSKU(submitData.name);
    }
    
    // Verifica duplicatas antes de salvar
    const duplicateName = products.find(p => 
      p.name.toLowerCase().trim() === submitData.name.toLowerCase().trim() && 
      (!editing || p.id !== editing.id)
    );
    
    const duplicateSku = products.find(p => 
      p.sku.toLowerCase().trim() === submitData.sku.toLowerCase().trim() && 
      (!editing || p.id !== editing.id)
    );
    
    if (duplicateName || duplicateSku) {
      let alertMessage = 'ATENÇÃO: Produto duplicado detectado!\n\n';
      if (duplicateName) {
        alertMessage += `- Nome duplicado: "${duplicateName.name}" (ID: ${duplicateName.id})\n`;
      }
      if (duplicateSku) {
        alertMessage += `- SKU duplicado: "${duplicateSku.sku}" (Produto: ${duplicateSku.name})\n`;
      }
      alertMessage += '\nDeseja continuar mesmo assim?';
      
      if (!confirm(alertMessage)) {
        return;
      }
    }
    
    // Confirmação antes de salvar
    const confirmMessage = editing 
      ? `Tem certeza que deseja atualizar o produto "${formData.name}"?`
      : `Tem certeza que deseja cadastrar o produto "${formData.name}"?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const url = editing ? `/api/products/${editing.id}` : '/api/products';
      const method = editing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        toast.success(editing ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
        loadProducts();
        resetForm();
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 409) {
          // Duplicate detected by backend
          alert(`ATENÇÃO: ${errorData.error || 'Produto duplicado detectado!'}`);
          toast.error(errorData.error || 'Produto duplicado detectado!');
        } else {
          toast.error(errorData.error || 'Falha ao salvar produto');
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto. Tente novamente.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Produto excluído');
        loadProducts();
      } else {
        toast.error('Falha ao excluir produto');
      }
    } catch (error) {
      toast.error('Erro ao excluir produto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditing(product);
    const costPrice = product.costPrice?.toString() || '';
    const salePrice = product.price.toString();
    let salePercentage = '';
    if (product.costPrice && product.costPrice > 0) {
      salePercentage = (((product.price - product.costPrice) / product.costPrice) * 100).toFixed(2);
    }
    setFormData({
      name: product.name,
      description: product.description,
      price: salePrice,
      originalPrice: product.originalPrice?.toString() || '',
      costPrice: costPrice,
      salePercentage: salePercentage,
      images: product.images,
      video: product.video || '',
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId || '',
      sku: product.sku,
      stock: product.stock.toString(),
      active: product.active,
      featured: product.featured,
      observations: product.observations || '',
    });
  };

  const generateSKU = (productName: string): string => {
    if (!productName) return '';
    
    // Remove acentos e caracteres especiais
    const normalized = productName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 20);
    
    // Adiciona timestamp para garantir unicidade
    const timestamp = Date.now().toString().slice(-6);
    return `${normalized}-${timestamp}`;
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      costPrice: '',
      salePercentage: '',
      images: [],
      video: '',
      categoryId: '',
      subcategoryId: '',
      sku: '',
      stock: '',
      active: true,
      featured: false,
      observations: '',
    });
    setImageInput('');
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
      // Upload files sequentially to avoid overwhelming the server
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

      // Add all successfully uploaded images
      if (uploadedUrls.length > 0) {
        setFormData({ ...formData, images: [...formData.images, ...uploadedUrls] });
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

  const addImage = () => {
    if (imageInput.trim()) {
      setFormData({ ...formData, images: [...formData.images, imageInput.trim()] });
      setImageInput('');
    }
  };

  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const moveImageLeft = (index: number) => {
    if (index === 0) return; // Already at the leftmost position
    const newImages = [...formData.images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setFormData({ ...formData, images: newImages });
  };

  const moveImageRight = (index: number) => {
    if (index === formData.images.length - 1) return; // Already at the rightmost position
    const newImages = [...formData.images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setFormData({ ...formData, images: newImages });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingVideo(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        setFormData({ ...formData, video: data.url });
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
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const removeVideo = () => {
    setFormData({ ...formData, video: '' });
  };

  const selectedCategory = categories.find(c => c.id === formData.categoryId);
  const subcategories = selectedCategory?.subcategories || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Gerenciar Produtos</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => {
                    const newName = e.target.value;
                    setFormData({ 
                      ...formData, 
                      name: newName,
                      // Gera SKU automaticamente quando o nome muda (apenas se SKU estiver vazio)
                      sku: !editing && !formData.sku ? generateSKU(newName) : formData.sku
                    });
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.sku || (formData.name ? generateSKU(formData.name) : '')}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="flex-1 border rounded px-3 py-2"
                    placeholder="Gerado automaticamente"
                    readOnly={!editing && !formData.sku}
                  />
                  {!editing && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, sku: generateSKU(formData.name) })}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                      disabled={!formData.name}
                    >
                      Gerar
                    </button>
                  )}
                </div>
                {!editing && (
                  <p className="text-xs text-gray-500 mt-1">
                    SKU será gerado automaticamente ao salvar se deixado em branco
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Observações (não visível ao comprador)</label>
              <textarea
                value={formData.observations}
                onChange={e => setFormData({ ...formData, observations: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
                placeholder="Observações internas sobre o produto..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Preço de Custo</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={e => {
                    const costPrice = e.target.value;
                    let newPrice = formData.price;
                    let newPercentage = formData.salePercentage;
                    
                    if (costPrice && formData.salePercentage) {
                      const cost = parseFloat(costPrice);
                      const percentage = parseFloat(formData.salePercentage);
                      if (!isNaN(cost) && !isNaN(percentage)) {
                        newPrice = (cost * (1 + percentage / 100)).toFixed(2);
                      }
                    } else if (costPrice && formData.price) {
                      const cost = parseFloat(costPrice);
                      const sale = parseFloat(formData.price);
                      if (!isNaN(cost) && !isNaN(sale) && cost > 0) {
                        newPercentage = (((sale - cost) / cost) * 100).toFixed(2);
                      }
                    }
                    
                    setFormData({ 
                      ...formData, 
                      costPrice: costPrice,
                      price: newPrice,
                      salePercentage: newPercentage
                    });
                  }}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Porcentagem de Venda (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.salePercentage}
                  onChange={e => {
                    const salePercentage = e.target.value;
                    let newPrice = formData.price;
                    
                    if (salePercentage && formData.costPrice) {
                      const cost = parseFloat(formData.costPrice);
                      const percentage = parseFloat(salePercentage);
                      if (!isNaN(cost) && !isNaN(percentage)) {
                        newPrice = (cost * (1 + percentage / 100)).toFixed(2);
                      }
                    }
                    
                    setFormData({ 
                      ...formData, 
                      salePercentage: salePercentage,
                      price: newPrice
                    });
                  }}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preço de Venda</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={e => {
                    const salePrice = e.target.value;
                    let newPercentage = formData.salePercentage;
                    
                    if (salePrice && formData.costPrice) {
                      const cost = parseFloat(formData.costPrice);
                      const sale = parseFloat(salePrice);
                      if (!isNaN(cost) && !isNaN(sale) && cost > 0) {
                        newPercentage = (((sale - cost) / cost) * 100).toFixed(2);
                      }
                    }
                    
                    setFormData({ 
                      ...formData, 
                      price: salePrice,
                      salePercentage: newPercentage
                    });
                  }}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Preço Original (para desconto)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estoque</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select
                value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '' })}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Selecione a categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              {subcategories.length > 0 && (
                <div>
              <label className="block text-sm font-medium mb-1">Subcategoria</label>
              <select
                value={formData.subcategoryId}
                onChange={e => setFormData({ ...formData, subcategoryId: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Nenhuma</option>
                    {subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Imagens</label>
              
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
                />
                {uploading && <p className="text-xs text-gray-500 mt-1">Enviando imagens...</p>}
              </div>

              {/* Upload de vídeo */}
              <div className="mb-2">
                <label className="block text-xs text-gray-600 mb-1">Enviar vídeo do computador:</label>
                <div className="flex items-center gap-2">
                  <label className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 font-medium">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                      className="hidden"
                    />
                    {uploadingVideo ? 'Enviando...' : 'Escolher Vídeo'}
                  </label>
                  {uploadingVideo && <span className="text-xs text-gray-500">Enviando vídeo...</span>}
                  {formData.video && (
                    <span className="text-xs text-green-600">✓ Vídeo carregado</span>
                  )}
                </div>
              </div>

              {/* Ou URL (opcional) */}
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={imageInput}
                  onChange={e => setImageInput(e.target.value)}
                  placeholder="Ou cole uma URL de imagem (opcional)"
                  className="flex-1 border rounded px-3 py-2"
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                  disabled={!imageInput.trim()}
                >
                  Adicionar URL
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.video && (
                  <div className="relative">
                    <video 
                      src={formData.video} 
                      className="w-20 h-20 object-cover rounded bg-gray-100"
                      preload="metadata"
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img src={img} alt={`Image ${index + 1}`} className="w-20 h-20 object-contain rounded bg-gray-100 border-2 border-gray-200" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity rounded flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveImageLeft(index)}
                        disabled={index === 0}
                        className={`bg-white rounded-full p-1.5 shadow-lg hover:bg-blue-50 hover:scale-110 transition-all ${
                          index === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
                        }`}
                        title="Mover para esquerda"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImageRight(index)}
                        disabled={index === formData.images.length - 1}
                        className={`bg-white rounded-full p-1.5 shadow-lg hover:bg-blue-50 hover:scale-110 transition-all ${
                          index === formData.images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
                        }`}
                        title="Mover para direita"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition z-10 shadow-md"
                      title="Remover imagem"
                    >
                      ×
                    </button>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                />
                Ativo
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                />
                Destaque
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
            <h3 className="font-bold">Produtos</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {products.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-gray-500 ml-2">R$ {formatPrice(product.price)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
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
