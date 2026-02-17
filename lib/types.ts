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
  images: string[];
  video?: string;
  categoryId: string;
  subcategoryId?: string;
  sku: string;
  stock: number;
  active: boolean;
  featured: boolean;
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
}
