import { SiteConfig, Order } from './types';
import { db } from './db';

export async function sendWhatsAppNotification(message: string): Promise<void> {
  try {
    const config = db.config.get();
    if (!config?.whatsappNumber) {
      console.error('WhatsApp number not configured');
      return;
    }

    let whatsappNumber = config.whatsappNumber.replace(/\D/g, '');
    
    // Ensure country code
    if (!whatsappNumber.startsWith('55')) {
      if (whatsappNumber.startsWith('42')) {
        whatsappNumber = '55' + whatsappNumber;
      } else {
        whatsappNumber = '5542991628586'; // Default fallback
      }
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // In a production environment, you would use a WhatsApp Business API
    // For now, this creates a URL that can be opened
    console.log('WhatsApp notification URL:', whatsappUrl);
    
    // If you have a WhatsApp Business API integration, you would send the message here
    // Example with a service like Twilio or WhatsApp Business API:
    // await fetch('https://api.whatsapp.com/v1/messages', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${whatsAppApiToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     to: whatsappNumber,
    //     message: message,
    //   }),
    // });
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
  }
}

export function formatOrderWhatsAppMessage(order: Order): string {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const itemsText = order.items.map(item => 
    `${item.quantity}x ${item.productName} (SKU: ${item.productSku}) - ${formatPrice(item.price * item.quantity)}`
  ).join('\n');

  const address = `${order.address.street}, ${order.address.number}${order.address.complement ? ', ' + order.address.complement : ''}\n${order.address.neighborhood}, ${order.address.city} - ${order.address.state}\nCEP: ${order.address.zipCode}`;

  return `*PAGAMENTO CONFIRMADO - Do Santos Market*\n\n` +
    `*PEDIDO #${order.id}*\n\n` +
    `*DADOS DO CLIENTE:*\n` +
    `Nome: ${order.customerName}\n` +
    `Email: ${order.customerEmail}\n` +
    `Telefone: ${order.customerPhone}\n` +
    `${order.customerCpf ? `CPF: ${order.customerCpf}\n` : ''}\n` +
    `*ENDEREÇO DE ENTREGA:*\n${address}\n\n` +
    `*ITENS DO PEDIDO:*\n${itemsText}\n\n` +
    `Subtotal: ${formatPrice(order.subtotal)}\n` +
    `Frete: ${order.shippingFee > 0 ? formatPrice(order.shippingFee) : 'Grátis'}\n` +
    `*TOTAL: ${formatPrice(order.total)}*\n\n` +
    `*STATUS DO PAGAMENTO:* ✅ APROVADO\n` +
    `${order.mercadoPagoPaymentId ? `ID Pagamento: ${order.mercadoPagoPaymentId}\n` : ''}` +
    `${order.notes ? `*OBSERVAÇÕES:*\n${order.notes}\n\n` : ''}` +
    `_Pagamento confirmado em ${new Date().toLocaleString('pt-BR')}_\n\n` +
    `*AÇÃO NECESSÁRIA:* Preparar e enviar o pedido.`;
}
