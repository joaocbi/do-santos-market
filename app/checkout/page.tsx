'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import WhatsAppButton from '@/components/WhatsAppButton';
import { cartUtils, CartItem } from '@/lib/cart';
import { SiteConfig } from '@/lib/types';

// Declaração de tipos para Mercado Pago
declare global {
  interface Window {
    MercadoPago: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentBrick, setShowPaymentBrick] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
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
    paymentMethod: 'whatsapp',
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
        console.log('Configuração carregada:', data);
        console.log('Token de Acesso Mercado Pago:', data?.mercadoPagoAccessToken ? '✅ Configurado' : '❌ Não configurado');
        
        // Verificação detalhada da chave pública
        const hasPublicKey = !!data?.mercadoPagoPublicKey && data.mercadoPagoPublicKey.trim().length > 0;
        if (hasPublicKey) {
          console.log('✅ Chave Pública Mercado Pago: Configurada');
          console.log(`   Preview: ${data.mercadoPagoPublicKey.substring(0, 20)}...`);
          console.log(`   Tamanho: ${data.mercadoPagoPublicKey.length} caracteres`);
          console.log('✅ Bricks Builder: Pode ser usado');
        } else {
          console.warn('⚠️ Chave Pública Mercado Pago: NÃO configurada');
          console.warn('⚠️ Bricks Builder: NÃO pode ser usado (será usado redirecionamento)');
          console.warn('   Para usar Bricks Builder, configure a chave pública no painel administrativo');
        }
        
        if (data?.whatsappNumber) {
          const cleanNumber = data.whatsappNumber.replace(/\D/g, '');
          console.log('Cleaned WhatsApp number:', cleanNumber);
          // Accept both formats: with country code (5542991628586) or without (42991628586)
          const isValidNumber = cleanNumber === '5542991628586' || cleanNumber === '42991628586';
          if (!isValidNumber) {
            console.warn('WARNING: WhatsApp number format may be incorrect. Expected 5542991628586 or 42991628586, got:', cleanNumber);
          }
        }
        setConfig(data);
      })
      .catch(error => {
        console.error('Erro ao carregar configuração:', error);
      });
  }, [router]);

  // Inicializa o Mercado Pago Bricks Builder
  useEffect(() => {
    if (!showPaymentBrick || !preferenceId || !config?.mercadoPagoPublicKey) {
      return;
    }

    // Aguarda o container estar disponível no DOM
    const initBricks = () => {
      const container = document.getElementById('paymentBrick_container');
      if (!container) {
        // Tenta novamente após um pequeno delay
        setTimeout(initBricks, 100);
        return;
      }

      // Carrega o script do Mercado Pago se ainda não estiver carregado
      const loadMercadoPagoScript = () => {
        return new Promise((resolve, reject) => {
          if (window.MercadoPago) {
            resolve(window.MercadoPago);
            return;
          }

          const script = document.createElement('script');
          script.src = 'https://sdk.mercadopago.com/js/v2';
          script.async = true;
          script.onload = () => resolve(window.MercadoPago);
          script.onerror = reject;
          document.body.appendChild(script);
        });
      };

      loadMercadoPagoScript()
        .then((mp: any) => {
          console.log('Mercado Pago SDK carregado com sucesso');
          console.log('Inicializando Bricks com:', {
            publicKey: config.mercadoPagoPublicKey?.substring(0, 20) + '...',
            preferenceId: preferenceId
          });

          const mpInstance = new mp(config.mercadoPagoPublicKey);
          const bricksBuilder = mpInstance.bricks();

          // Limpa o container antes de criar o brick
          container.innerHTML = '';

          console.log('Criando brick de pagamento...');

          bricksBuilder.create(
            'payment',
            'paymentBrick_container',
            {
              initialization: {
                preferenceId: preferenceId
              },
              callbacks: {
                onSubmit: async (formData: any) => {
                  console.log('Pagamento disparado pelo Bricks:', formData);

                  try {
                    // Prepara os dados para o endpoint
                    const paymentData = {
                      token: formData.token,
                      transaction_amount: formData.transaction_amount || formData.amount,
                      payment_method_id: formData.payment_method_id,
                      installments: formData.installments || 1,
                      payer: {
                        email: formData.payer?.email || formData.email,
                        identification: formData.payer?.identification
                      },
                      external_reference: currentOrderId?.toString()
                    };

                    console.log('Enviando dados para processamento:', {
                      hasToken: !!paymentData.token,
                      transaction_amount: paymentData.transaction_amount,
                      payment_method_id: paymentData.payment_method_id,
                      orderId: paymentData.external_reference
                    });

                    const response = await fetch('/api/payment/process', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(paymentData)
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      console.error('Erro na resposta:', errorData);
                      throw new Error(errorData.details || errorData.error || 'Erro ao processar pagamento');
                    }

                    const result = await response.json();
                    console.log('Resultado do processamento:', result);
                    
                    // O Bricks espera um objeto com status e id
                    const bricksResponse = {
                      status: result.status,
                      status_detail: result.payment_result?.status_detail || result.status,
                      id: result.payment_id || result.payment_result?.id
                    };

                    // Redireciona baseado no status
                    if (result.status === 'approved') {
                      // Limpa o carrinho
                      cartUtils.clearCart();
                      // Redireciona para página de sucesso após um pequeno delay
                      setTimeout(() => {
                        window.location.href = result.redirect_url || `/payment/success?order_id=${currentOrderId}`;
                      }, 500);
                    } else if (result.status === 'rejected') {
                      // Redireciona para página de falha
                      setTimeout(() => {
                        window.location.href = result.redirect_url || `/payment/failure?order_id=${currentOrderId}`;
                      }, 500);
                    } else {
                      // Redireciona para página de pendente
                      setTimeout(() => {
                        window.location.href = result.redirect_url || `/payment/pending?order_id=${currentOrderId}`;
                      }, 500);
                    }

                    // Retorna a resposta no formato esperado pelo Bricks
                    return bricksResponse;
                  } catch (error: any) {
                    console.error('Erro ao processar pagamento:', error);
                    // Retorna erro no formato esperado pelo Bricks
                    return {
                      status: 'error',
                      status_detail: error?.message || 'Erro ao processar pagamento',
                      message: error?.message || 'Erro ao processar pagamento'
                    };
                  }
                },
                onError: (error: any) => {
                  console.error('Erro no pagamento', error);
                  console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
                  alert(`Erro ao processar pagamento: ${error?.message || 'Erro desconhecido'}. Por favor, tente novamente.`);
                },
                onReady: () => {
                  console.log('✅ Brick de pagamento pronto e renderizado');
                  console.log('Verificando se o botão está habilitado...');
                  
                  // Verifica se o botão está presente e habilitado
                  setTimeout(() => {
                    const brickButton = container.querySelector('button[type="submit"]') || 
                                       container.querySelector('button') ||
                                       container.querySelector('[data-testid="submit-button"]');
                    
                    if (brickButton) {
                      console.log('Botão encontrado:', {
                        disabled: (brickButton as HTMLButtonElement).disabled,
                        text: (brickButton as HTMLElement).textContent,
                        classes: (brickButton as HTMLElement).className
                      });
                    } else {
                      console.warn('⚠️ Botão do Bricks não encontrado no container');
                    }
                  }, 1000);
                }
              }
            }
          ).then((brickController: any) => {
            console.log('Brick criado com sucesso:', brickController);
          }).catch((error: any) => {
            console.error('❌ Erro ao criar brick:', error);
            console.error('Detalhes:', JSON.stringify(error, null, 2));
            alert(`Erro ao inicializar o formulário de pagamento: ${error?.message || 'Erro desconhecido'}. Por favor, recarregue a página.`);
          });
        })
        .catch((error) => {
          console.error('❌ Erro ao carregar Mercado Pago SDK:', error);
          alert('Erro ao carregar o sistema de pagamento. Por favor, recarregue a página.');
        });
    };

    // Inicia após um pequeno delay para garantir que o DOM está atualizado
    setTimeout(initBricks, 200);
  }, [showPaymentBrick, preferenceId, config?.mercadoPagoPublicKey, currentOrderId]);

  // Log de debug para verificar estado
  useEffect(() => {
    if (showPaymentBrick) {
      console.log('Estado do Bricks:', {
        showPaymentBrick,
        preferenceId,
        hasPublicKey: !!config?.mercadoPagoPublicKey,
        currentOrderId,
        containerExists: !!document.getElementById('paymentBrick_container')
      });
    }
  }, [showPaymentBrick, preferenceId, config?.mercadoPagoPublicKey, currentOrderId]);

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

    try {
      // Create order
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
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      };

      console.log('Enviando pedido para API:', {
        customerName: orderData.customerName,
        itemsCount: orderData.items.length,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod
      });

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      console.log('Resposta da API:', {
        status: orderResponse.status,
        statusText: orderResponse.statusText,
        ok: orderResponse.ok
      });

      if (!orderResponse.ok) {
        let errorData;
        try {
          const text = await orderResponse.text();
          console.error('Resposta de erro (texto):', text);
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { 
            error: `Erro ${orderResponse.status}: ${orderResponse.statusText}`,
            details: 'Não foi possível parsear a resposta de erro'
          };
        }
        
        console.error('Erro ao criar pedido:', {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          errorData: errorData
        });
        
        // Handle database configuration error specifically
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

      // Process payment based on method
      if (formData.paymentMethod === 'mercado_pago') {
        // Check if Mercado Pago is configured before proceeding
        if (!config?.mercadoPagoAccessToken) {
          alert('Mercado Pago não está configurado. Por favor, configure as credenciais no painel administrativo ou escolha pagamento via WhatsApp.');
          setIsSubmitting(false);
          return;
        }

        // Cria pagamento e redireciona para Mercado Pago
        console.log('Criando pagamento Mercado Pago para pedido:', order.id);
        
        const paymentResponse = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            paymentMethod: 'mercado_pago',
          }),
        });

        console.log('Resposta da criação de pagamento:', {
          status: paymentResponse.status,
          statusText: paymentResponse.statusText,
          ok: paymentResponse.ok
        });

        if (!paymentResponse.ok) {
          let errorData;
          try {
            const errorText = await paymentResponse.text();
            console.error('Texto de erro recebido:', errorText);
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: `Erro ${paymentResponse.status}: ${paymentResponse.statusText}` };
          }
          
          console.error('Erro ao criar pagamento:', {
            status: paymentResponse.status,
            errorData: errorData
          });
          
          if (paymentResponse.status === 404) {
            alert('Erro: Endpoint de pagamento não encontrado. Por favor, tente novamente ou escolha pagamento via WhatsApp.');
            setIsSubmitting(false);
            return;
          }
          
          if (errorData.code === 'NOT_CONFIGURED') {
            alert('Mercado Pago não está configurado. Por favor, configure as credenciais no painel administrativo ou escolha pagamento via WhatsApp.');
            setIsSubmitting(false);
            return;
          }
          
          if (errorData.code === 'PAYMENT_CREATION_FAILED') {
            const errorMsg = errorData.details || errorData.error || 'Erro desconhecido ao criar pagamento';
            alert(`Erro ao processar pagamento: ${errorMsg}\n\nPor favor, tente novamente ou escolha pagamento via WhatsApp.`);
            setIsSubmitting(false);
            return;
          }
          
          // Mostra mensagem de erro amigável ao usuário
          const errorMessage = errorData.error || errorData.details || errorData.message || 'Erro desconhecido';
          alert(`Erro ao processar pagamento: ${errorMessage}\n\nPor favor, tente novamente ou escolha pagamento via WhatsApp.`);
          setIsSubmitting(false);
          return;
        }

        const payment = await paymentResponse.json();
        
        console.log('Resposta do pagamento recebida:', {
          paymentId: payment.paymentId,
          preferenceId: payment.preferenceId,
          hasPreferenceId: !!(payment.preferenceId || payment.paymentId),
          fullResponse: payment
        });
        
        const prefId = payment.preferenceId || payment.paymentId;
        if (!prefId) {
          console.error('❌ Erro: ID da preferência não disponível', payment);
          alert('Erro: Não foi possível obter o ID da preferência. Por favor, tente novamente ou escolha pagamento via WhatsApp.');
          setIsSubmitting(false);
          return;
        }

        // Verifica se temos chave pública para usar Bricks
        if (!config?.mercadoPagoPublicKey) {
          console.warn('⚠️ Chave pública não configurada, usando redirecionamento');
          // Fallback para redirecionamento se não tiver chave pública
          if (payment.initPoint || payment.sandboxInitPoint) {
            cartUtils.clearCart();
            window.location.href = payment.initPoint || payment.sandboxInitPoint;
            return;
          }
        }
        
        console.log('✅ Configurando Bricks Builder com preferenceId:', prefId);
        
        // Configura o Bricks Builder
        setPreferenceId(prefId);
        setCurrentOrderId(order.id);
        setShowPaymentBrick(true);
        setIsSubmitting(false);
        
        // Scroll para o brick de pagamento
        setTimeout(() => {
          const brickContainer = document.getElementById('paymentBrick_container');
          if (brickContainer) {
            brickContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        // WhatsApp payment flow (original)
        const orderItemsText = cartItems.map(item => 
          `${item.quantity}x ${item.product.name} (SKU: ${item.product.sku}) - ${formatPrice(item.product.price * item.quantity)}`
        ).join('\n');

        const address = `${formData.street}, ${formData.number}${formData.complement ? ', ' + formData.complement : ''}\n${formData.neighborhood}, ${formData.city} - ${formData.state}\nCEP: ${formData.zipCode}`;

        const message = `*NOVO PEDIDO - Do Santos Market*\n\n` +
          `*PEDIDO #${order.id}*\n\n` +
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
          `Em instantes você receberá link do Mercado Pago, em nome de João Batista dos Santos para realizar seu pagamento. Após a confirmação de seu pagamento seu produto será enviado.`;

        if (config?.whatsappNumber) {
          let whatsappNumber = config.whatsappNumber.replace(/\D/g, '');
          
          if (!whatsappNumber) {
            alert('Erro: Número do WhatsApp inválido. Entre em contato com o administrador.');
            setIsSubmitting(false);
            return;
          }
          
          const correctNumber = '5542991628586';
          if (whatsappNumber !== correctNumber && whatsappNumber !== '42991628586') {
            whatsappNumber = correctNumber;
          } else if (whatsappNumber === '42991628586') {
            whatsappNumber = correctNumber;
          }
          
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
      }
    } catch (error: any) {
      console.error('Erro no checkout:', error);
      
      // Handle database-related errors with more context
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
              <h2 className="text-xl font-bold mb-4">Método de Pagamento</h2>
              <div className="space-y-3">
                {/* Always show Mercado Pago option - will be enabled/disabled based on config */}
                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                  formData.paymentMethod === 'mercado_pago' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:bg-gray-50'
                } ${!config?.mercadoPagoAccessToken ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="mercado_pago"
                    checked={formData.paymentMethod === 'mercado_pago'}
                    onChange={handleInputChange}
                    disabled={!config?.mercadoPagoAccessToken}
                    className="w-5 h-5 text-primary disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-lg">💳 Pagamento Online (Mercado Pago)</div>
                    <div className="text-sm text-gray-600 mt-1">Pague diretamente no site com cartão, PIX ou boleto</div>
                    <div className="text-xs text-green-600 mt-1 font-medium">✓ Mais rápido e seguro</div>
                    {!config?.mercadoPagoAccessToken && (
                      <div className="text-xs text-yellow-600 mt-1 font-medium">⚠️ Configurando...</div>
                    )}
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                  formData.paymentMethod === 'whatsapp' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="whatsapp"
                    checked={formData.paymentMethod === 'whatsapp'}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-primary"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-lg">📱 Pagamento via WhatsApp</div>
                    <div className="text-sm text-gray-600 mt-1">Você receberá as instruções de pagamento via WhatsApp</div>
                  </div>
                </label>
              </div>
              {config === null && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Carregando configurações...</strong>
                  </p>
                </div>
              )}
              {config !== null && !config?.mercadoPagoAccessToken && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Nota:</strong> Para ativar pagamento online, configure as credenciais do Mercado Pago no painel administrativo.
                  </p>
                </div>
              )}
              {config?.mercadoPagoAccessToken && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-800">
                    <strong>✓ Mercado Pago configurado:</strong> Pagamento online disponível
                  </p>
                </div>
              )}
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
                {isSubmitting 
                  ? 'Processando...' 
                  : formData.paymentMethod === 'mercado_pago' 
                    ? 'Pagar Agora' 
                    : 'Finalizar Pedido via WhatsApp'}
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

        {/* Container para o Mercado Pago Bricks */}
        {showPaymentBrick && preferenceId && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Finalize seu Pagamento</h2>
            <p className="text-gray-600 mb-6">
              Preencha os dados abaixo para concluir seu pagamento de forma segura.
            </p>
            <div id="paymentBrick_container" className="w-full"></div>
          </div>
        )}
      </main>
      <WhatsAppButton />
    </div>
  );
}
