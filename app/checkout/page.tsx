'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import WhatsAppButton from '@/components/WhatsAppButton';
import { cartUtils, CartItem } from '@/lib/cart';
import { SiteConfig, Order, PaymentMethod } from '@/lib/types';
import { formatOrderNumber } from '@/lib/orderUtils';

// Force no cache for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const retryOrderId = searchParams.get('retry_order');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [retryOrder, setRetryOrder] = useState<Order | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('whatsapp');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
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
    notes: '',
  });

  useEffect(() => {
    // Load retry order if retry_order parameter exists
    if (retryOrderId) {
      fetch(`/api/orders/${retryOrderId}`)
        .then(res => res.json())
        .then(data => {
          setRetryOrder(data);
          // Pre-fill form with order data
          if (data) {
            setFormData({
              name: data.customerName || '',
              email: data.customerEmail || '',
              phone: data.customerPhone || '',
              cpf: data.customerCpf || '',
              street: data.address?.street || '',
              number: data.address?.number || '',
              complement: data.address?.complement || '',
              neighborhood: data.address?.neighborhood || '',
              city: data.address?.city || '',
              state: data.address?.state || '',
              zipCode: data.address?.zipCode || '',
              notes: data.notes || '',
            });
          }
        })
        .catch(error => {
          console.error('Error loading retry order:', error);
        });
    }

    const items = cartUtils.getCart();
    if (items.length === 0 && !retryOrderId) {
      router.push('/cart');
      return;
    }
    if (items.length > 0) {
      setCartItems(items);
    } else if (retryOrderId && retryOrder) {
      // If retrying order, set cart items from order
      const orderItems = retryOrder.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.productId,
          name: item.productName,
          sku: item.productSku,
          price: item.price,
          images: [],
          stock: 0,
          active: true,
        },
      }));
      setCartItems(orderItems as CartItem[]);
    }

    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
      })
      .catch(error => {
        console.error('Error loading config:', error);
      });

    // Load payment methods
    fetch('/api/payment-methods')
      .then(res => res.json())
      .then(data => {
        const activeMethods = data.filter((m: PaymentMethod) => m.active);
        setPaymentMethods(activeMethods);
        if (activeMethods.length > 0 && !retryOrderId) {
          setSelectedPaymentMethod(activeMethods[0].id);
        }
      })
      .catch(error => {
        console.error('Error loading payment methods:', error);
      });
  }, [router, retryOrderId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const subtotal = retryOrder ? retryOrder.subtotal : cartUtils.getCartTotal();
  const shippingFee = retryOrder ? retryOrder.shippingFee : (subtotal < 300 ? 20 : 0);
  const total = retryOrder ? retryOrder.total : (subtotal + shippingFee);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
    if (errors.cpf) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.cpf;
        return newErrors;
      });
    }
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setFormData(prev => ({ ...prev, zipCode: formatted }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    }
    
    const cpfNumbers = formData.cpf.replace(/\D/g, '');
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (cpfNumbers.length !== 11) {
      newErrors.cpf = 'CPF deve ter 11 dígitos';
    }
    
    if (!formData.street.trim()) {
      newErrors.street = 'Rua é obrigatória';
    }
    
    if (!formData.number.trim()) {
      newErrors.number = 'Número é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMercadoPagoPaymentClick = () => {
    // Show security confirmation modal first
    setShowSecurityModal(true);
  };

  const handleMercadoPagoPayment = async () => {
    if (!retryOrder) {
      alert('Pedido não encontrado');
      return;
    }

    if (!config?.mercadoPagoAccessToken) {
      alert('Mercado Pago não está configurado. Entre em contato com o administrador.');
      return;
    }

    // Close modal and proceed with payment
    setShowSecurityModal(false);
    setIsCreatingPayment(true);

    try {
      const response = await fetch('/api/mercadopago/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: retryOrder.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar pagamento');
      }

      const data = await response.json();
      
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('URL de pagamento não retornada');
      }
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      alert(error.message || 'Erro ao processar pagamento. Tente novamente.');
      setIsCreatingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Force CPF validation - ALWAYS check first
    const cpfNumbers = formData.cpf.replace(/\D/g, '');
    if (!formData.cpf || !formData.cpf.trim()) {
      setErrors(prev => ({
        ...prev,
        cpf: 'CPF é obrigatório'
      }));
      const cpfInput = document.querySelector('input[name="cpf"]') as HTMLElement;
      if (cpfInput) {
        cpfInput.focus();
        cpfInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      alert('CPF é obrigatório. Por favor, preencha o campo CPF.');
      return;
    }
    
    if (cpfNumbers.length !== 11) {
      setErrors(prev => ({
        ...prev,
        cpf: 'CPF deve ter 11 dígitos'
      }));
      const cpfInput = document.querySelector('input[name="cpf"]') as HTMLElement;
      if (cpfInput) {
        cpfInput.focus();
        cpfInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      alert('CPF inválido. Deve conter 11 dígitos.');
      return;
    }
    
    if (!validateForm()) {
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        const errorInput = document.querySelector(`[name="${firstError}"]`) as HTMLElement;
        if (errorInput) {
          errorInput.focus();
          errorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const orderData = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerCpf: formData.cpf,
        address: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        items: orderItems,
        subtotal: subtotal,
        shippingFee: shippingFee,
        total: total,
        paymentMethod: selectedPaymentMethod || 'whatsapp',
        notes: formData.notes,
      };

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        let errorData;
        try {
          const text = await orderResponse.text();
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { 
            error: `Erro ${orderResponse.status}: ${orderResponse.statusText}`
          };
        }
        
        if (errorData.code === 'DATABASE_NOT_CONFIGURED') {
          const instructions = errorData.instructions || [];
          const message = `Banco de dados não configurado.\n\n${errorData.details || ''}\n\n${instructions.join('\n')}`;
          alert(message);
          setIsSubmitting(false);
          return;
        }
        
        throw new Error(errorData.error || errorData.details || 'Falha ao criar pedido');
      }

      const order = await orderResponse.json();

      // WhatsApp payment flow
      const orderItemsText = cartItems.map(item => 
        `${item.quantity}x ${item.product.name} (SKU: ${item.product.sku}) - ${formatPrice(item.product.price * item.quantity)}`
      ).join('\n');

      const address = `${formData.street}, ${formData.number}${formData.complement ? ', ' + formData.complement : ''}\n${formData.neighborhood}, ${formData.city} - ${formData.state}\nCEP: ${formData.zipCode}`;

      const orderNumber = formatOrderNumber(order.id);
      const message = `*NOVO PEDIDO - Do Santos Market*\n\n` +
        `*PEDIDO #${orderNumber}*\n\n` +
        `*DADOS DO CLIENTE:*\n` +
        `Nome: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Telefone: ${formData.phone}\n` +
        `${formData.cpf ? `CPF: ${formData.cpf}\n` : ''}\n` +
        `*ENDEREÇO DE ENTREGA:*\n${address}\n\n` +
        `*ITENS DO PEDIDO:*\n${orderItemsText}\n\n` +
        `Subtotal: ${formatPrice(subtotal)}\n` +
        `Frete: ${shippingFee > 0 ? formatPrice(shippingFee) : 'Grátis'}\n` +
        `*TOTAL: ${formatPrice(total)}*\n\n` +
        `${formData.notes ? `*OBSERVAÇÕES:*\n${formData.notes}\n\n` : ''}` +
        `_Pedido realizado em ${new Date().toLocaleString('pt-BR')}_\n` +
        `*Prazo de Entrega:* até 10 dias após confirmação do pagamento.\n\n` +
        `*INFORMAÇÕES DE PAGAMENTO:*\n` +
        `Você receberá as instruções de pagamento em breve.`;

      if (config?.whatsappNumber) {
        const whatsappNumber = config.whatsappNumber.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        const whatsappMobileUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

        cartUtils.clearCart();
        
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          window.location.href = whatsappMobileUrl;
        } else {
          const link = document.createElement('a');
          link.href = whatsappMobileUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
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
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('Erro no checkout:', error);
      
      if (error.message?.includes('Banco de dados não configurado') || 
          error.message?.includes('DATABASE_NOT_CONFIGURED')) {
        alert('Banco de dados não configurado. Por favor, configure o banco de dados Postgres nas configurações do projeto na Vercel.');
      } else if (error.message?.includes('conexão') || error.message?.includes('connection')) {
        alert('Erro de conexão com o banco de dados. Verifique se o banco de dados está configurado corretamente.');
      } else {
        alert(error.message || 'Erro ao processar pedido. Tente novamente.');
      }
      setIsSubmitting(false);
    }
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
                  <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent max-w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent max-w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    required
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent max-w-full"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    <span>CPF</span>
                    <span className="text-red-500 font-bold text-lg ml-1">*</span>
                    <span className="text-red-500 text-xs font-semibold ml-1">(Obrigatório)</span>
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                    aria-required="true"
                    data-required="true"
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent max-w-full ${
                      errors.cpf ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    onBlur={(e) => {
                      const target = e.target as HTMLInputElement;
                      const cpfNumbers = target.value.replace(/\D/g, '');
                      if (!target.value.trim()) {
                        setErrors(prev => ({ ...prev, cpf: 'CPF é obrigatório' }));
                      } else if (cpfNumbers.length !== 11) {
                        setErrors(prev => ({ ...prev, cpf: 'CPF deve ter 11 dígitos' }));
                      } else {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.cpf;
                          return newErrors;
                        });
                      }
                    }}
                    onInvalid={(e) => {
                      e.preventDefault();
                      const target = e.target as HTMLInputElement;
                      const cpfNumbers = target.value.replace(/\D/g, '');
                      if (cpfNumbers.length === 0) {
                        setErrors(prev => ({ ...prev, cpf: 'CPF é obrigatório' }));
                      } else if (cpfNumbers.length !== 11) {
                        setErrors(prev => ({ ...prev, cpf: 'CPF deve ter 11 dígitos' }));
                      }
                    }}
                  />
                  {errors.cpf && (
                    <p className="text-red-500 text-sm mt-1 font-semibold">{errors.cpf}</p>
                  )}
                  {!errors.cpf && formData.cpf && formData.cpf.replace(/\D/g, '').length === 11 && (
                    <p className="text-green-600 text-xs mt-1">✓ CPF válido</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Endereço de Entrega</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Rua *</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent max-w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Número *</label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent max-w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Complemento</label>
                  <input
                    type="text"
                    name="complement"
                    value={formData.complement}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent max-w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bairro</label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent max-w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cidade</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent max-w-full"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent max-w-full"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent max-w-full"
                  />
                </div>
              </div>
            </div>

            {!retryOrder && paymentMethods.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Método de Pagamento</h2>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedPaymentMethod === method.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedPaymentMethod === method.id}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="mr-3 w-5 h-5 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="font-semibold">{method.name}</div>
                        {method.type === 'credit' && method.installments && (
                          <div className="text-sm text-gray-600">
                            Em até {method.installments}x sem juros
                          </div>
                        )}
                        {method.fee && method.fee > 0 && (
                          <div className="text-sm text-gray-600">
                            Taxa: {formatPrice(method.fee)}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Observações</h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Alguma observação sobre o pedido?"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent max-w-full resize-none"
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-24 max-w-full overflow-hidden">
              <h2 className="text-lg sm:text-xl font-bold mb-4 break-words">Resumo do Pedido</h2>
              <div className="space-y-2 mb-4">
                {retryOrder ? (
                  retryOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-xs sm:text-sm break-words">
                      <span className="break-words flex-1 min-w-0 pr-2">{item.quantity}x {item.productName}</span>
                      <span className="font-semibold break-words flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))
                ) : (
                  cartItems.map((item) => (
                    <div key={item.productId} className="flex justify-between text-xs sm:text-sm break-words">
                      <span className="break-words flex-1 min-w-0 pr-2">{item.quantity}x {item.product.name}</span>
                      <span className="font-semibold break-words flex-shrink-0">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2 mb-4 pt-3 border-t">
                <div className="flex justify-between text-sm sm:text-base break-words">
                  <span className="break-words">Subtotal:</span>
                  <span className="font-semibold break-words ml-2">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base break-words">
                  <span className="break-words">Frete:</span>
                  <span className="font-semibold break-words ml-2">
                    {shippingFee > 0 ? formatPrice(shippingFee) : 'Grátis'}
                  </span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t break-words">
                  <span className="break-words">Total:</span>
                  <span className="text-primary break-words ml-2">{formatPrice(total)}</span>
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
              
              {retryOrder && config?.mercadoPagoAccessToken ? (
                <>
                  <button
                    type="button"
                    onClick={handleMercadoPagoPaymentClick}
                    disabled={isCreatingPayment}
                    className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                  >
                    {isCreatingPayment ? 'Processando...' : 'Pagar com Mercado Pago'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                  >
                    {isSubmitting ? 'Processando...' : 'Finalizar via WhatsApp'}
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {isSubmitting ? 'Processando...' : 'Finalizar Pedido via WhatsApp'}
                </button>
              )}
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
      
      {/* Security Confirmation Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">Confirmação de Segurança</h2>
              <p className="text-gray-600 text-center mb-4">
                Você está prestes a ser redirecionado para o Mercado Pago para finalizar o pagamento.
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Importante - Segurança:</p>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>Certifique-se de que você está em um ambiente seguro</li>
                <li>Não compartilhe sua senha do Mercado Pago com ninguém</li>
                <li>O Mercado Pago pode solicitar autenticação adicional</li>
                <li>Em caso de perda ou furto do aparelho, entre em contato imediatamente com o Mercado Pago</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Valor do pedido:</strong> {formatPrice(retryOrder?.total || 0)}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Pedido:</strong> #{retryOrder ? formatOrderNumber(retryOrder.id) : ''}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSecurityModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleMercadoPagoPayment}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Confirmar e Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p>Carregando...</p>
          </div>
        </main>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
