export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  image?: string;
  order: number;
  subcategories?: Category[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  images: string[];
  video?: string;
  categoryId: string;
  subcategoryId?: string;
  sku: string;
  stock: number;
  active: boolean;
  featured: boolean;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  address: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'credit' | 'debit' | 'pix' | 'boleto' | 'cash';
  active: boolean;
  installments?: number;
  fee?: number;
}

export interface DeliveryMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
  active: boolean;
  freeShippingThreshold?: number;
}

export interface Banner {
  id: string;
  title: string;
  image: string;
  link?: string;
  order: number;
  active: boolean;
  position: 'home' | 'category' | 'product';
}

export interface ClickableLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  order: number;
  active: boolean;
}

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  order: number;
  category?: string;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  type: 'youtube' | 'vimeo' | 'direct';
  thumbnail?: string;
  order: number;
  active: boolean;
}

export interface SiteConfig {
  whatsappNumber: string;
  email: string;
  socialMedia: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  mercadoPagoAccessToken?: string;
  mercadoPagoPublicKey?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpf?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
  paymentId?: string;
  mercadoPagoPaymentId?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
