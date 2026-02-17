'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import WhatsAppButton from '@/components/WhatsAppButton';
import { cartUtils, CartItem } from '@/lib/cart';
import { SiteConfig } from '@/lib/types';

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: '',
    deliveryMethod: '',
    notes: '',
  });

  useEffect(() => {
    const items = cartUtils.getCart();
    if (items.length === 0) {
      router.push('/cart');
      return;
    }
    setCartItems(items);

    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        console.log('Config loaded:', data);
        setConfig(data);
      })
      .catch(error => {
        console.error('Error loading config:', error);
      });
  }, [router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const subtotal = cartUtils.getCartTotal();
  const shippingFee = subtotal < 300 ? 20 : 0;
  const total = subtotal + shippingFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setFormData(prev => ({ ...prev, zipCode: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.email || !formData.street || !formData.number) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    const orderItems = cartItems.map(item => 
      `${item.quantity}x ${item.product.name} - ${formatPrice(item.product.price * item.quantity)}`
    ).join('\n');

    const address = `${formData.street}, ${formData.number}${formData.complement ? ', ' + formData.complement : ''}\n${formData.neighborhood}, ${formData.city} - ${formData.state}\nCEP: ${formData.zipCode}`;

    const message = `*NOVO PEDIDO - Do Santos Market*\n\n` +
      `*DADOS DO CLIENTE:*\n` +
      `Nome: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Telefone: ${formData.phone}\n` +
      `${formData.cpf ? `CPF: ${formData.cpf}\n` : ''}\n` +
      `*ENDEREÇO DE ENTREGA:*\n${address}\n\n` +
      `*ITENS DO PEDIDO:*\n${orderItems}\n\n` +
      `Subtotal: ${formatPrice(subtotal)}\n` +
      `Frete: ${shippingFee > 0 ? formatPrice(shippingFee) : 'Grátis'}\n` +
      `*TOTAL: ${formatPrice(total)}*\n\n` +
      `${formData.notes ? `*OBSERVAÇÕES:*\n${formData.notes}\n\n` : ''}` +
      `_Pedido realizado em ${new Date().toLocaleString('pt-BR')}_\n\n` +
      `*INFORMAÇÕES DE PAGAMENTO:*\n` +
      `Em instantes você receberá link do Mercado Pago, em nome de João Batista dos Santos para realizar seu pagamento. Após a confirmação de seu pagamento seu produto será enviado.`;

    if (config?.whatsappNumber) {
      const whatsappNumber = config.whatsappNumber.replace(/\D/g, '');
      
      if (!whatsappNumber) {
        alert('Erro: Número do WhatsApp inválido. Entre em contato com o administrador.');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Enviando para WhatsApp:', whatsappNumber);
      console.log('Número original do config:', config.whatsappNumber);
      
      cartUtils.clearCart();
      
      const encodedMessage = encodeURIComponent(message);
      const whatsappMobileUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`;
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        window.location.href = whatsappMobileUrl;
      } else {
        const link = document.createElement('a');
        link.href = whatsappMobileUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => {
          const fallbackUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
          window.location.href = fallbackUrl;
        }, 1500);
      }
    } else {
      alert('Erro: Número do WhatsApp não configurado. Entre em contato com o administrador.');
    }

    setIsSubmitting(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Dados Pessoais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    required
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CPF</label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Endereço de Entrega</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Rua <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Número <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Complemento</label>
                  <input
                    type="text"
                    name="complement"
                    value={formData.complement}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bairro</label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cidade</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estado</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CEP</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleCEPChange}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Observações</h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Alguma observação sobre o pedido?"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>
              <div className="space-y-2 mb-4">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span>{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mb-4 pt-3 border-t">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span className="font-semibold">
                    {shippingFee > 0 ? formatPrice(shippingFee) : 'Grátis'}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>
              
              {subtotal < 300 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Frete Grátis:</strong> Adicione mais {formatPrice(300 - subtotal)} em produtos para ganhar frete grátis em compras acima de R$ 300,00!
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800">
                    <strong>✓ Frete Grátis:</strong> Você ganhou frete grátis nesta compra!
                  </p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {isSubmitting ? 'Enviando...' : 'Finalizar Pedido via WhatsApp'}
              </button>
              <Link
                href="/cart"
                className="block w-full text-center text-gray-600 hover:text-primary transition"
              >
                Voltar ao Carrinho
              </Link>
            </div>
          </div>
        </form>
      </main>
      <WhatsAppButton />
    </div>
  );
}
