import fs from 'fs';
import path from 'path';
import {
  Category,
  Product,
  Customer,
  PaymentMethod,
  DeliveryMethod,
  Banner,
  ClickableLink,
  GalleryImage,
  Video,
  SiteConfig,
  Order,
} from './types';
import { dbPostgres, isPostgresAvailable } from './db-postgres';

const dbPath = path.join(process.cwd(), 'data');

// Ensure data directory exists (only for local development)
if (typeof window === 'undefined' && !process.env.VERCEL && fs.existsSync && !fs.existsSync(dbPath)) {
  try {
    fs.mkdirSync(dbPath, { recursive: true });
  } catch (error) {
    // Ignore errors in production
  }
}

const getDbFile = (filename: string) => path.join(dbPath, filename);

const readJson = <T>(filename: string, defaultValue: T): T => {
  if (typeof window !== 'undefined') {
    // Client-side: return default
    return defaultValue;
  }
  
  const filePath = getDbFile(filename);
  if (!fs.existsSync || !fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
};

const writeJson = <T>(filename: string, data: T): void => {
  if (typeof window !== 'undefined' || process.env.VERCEL) {
    // Client-side or Vercel: cannot write
    return;
  }
  
  try {
    const filePath = getDbFile(filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error: any) {
    console.error(`Error writing ${filename}:`, error?.message || error);
    throw error;
  }
};

// Helper to convert async Postgres methods to sync for compatibility
const makeSync = <T>(asyncFn: () => Promise<T>, defaultValue: T): T => {
  if (isPostgresAvailable()) {
    // In Postgres mode, we need to handle async, but for now return default
    // The API routes should use async methods directly
    return defaultValue;
  }
  return defaultValue;
};

// Database operations with Postgres fallback to JSON
export const db = {
  categories: {
    getAll: (): Category[] => {
      if (isPostgresAvailable()) {
        // Return empty array - API routes should use async methods
        return [];
      }
      return readJson('categories.json', []);
    },
    getById: (id: string): Category | undefined => {
      if (isPostgresAvailable()) {
        return undefined;
      }
      const categories = readJson<Category[]>('categories.json', []);
      return categories.find(c => c.id === id);
    },
    create: (category: Category): Category => {
      if (isPostgresAvailable()) {
        // In Postgres mode, this should be called via async API
        throw new Error('Use async dbPostgres.categories.create() when Postgres is available');
      }
      const categories = readJson<Category[]>('categories.json', []);
      categories.push(category);
      writeJson('categories.json', categories);
      return category;
    },
    update: (id: string, updates: Partial<Category>): Category | null => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.categories.update() when Postgres is available');
      }
      const categories = readJson<Category[]>('categories.json', []);
      const index = categories.findIndex(c => c.id === id);
      if (index === -1) return null;
      categories[index] = { ...categories[index], ...updates };
      writeJson('categories.json', categories);
      return categories[index];
    },
    delete: (id: string): boolean => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.categories.delete() when Postgres is available');
      }
      const categories = readJson<Category[]>('categories.json', []);
      const filtered = categories.filter(c => c.id !== id);
      writeJson('categories.json', filtered);
      return filtered.length < categories.length;
    },
  },

  products: {
    getAll: (): Product[] => {
      if (isPostgresAvailable()) {
        return [];
      }
      return readJson('products.json', []);
    },
    getById: (id: string): Product | undefined => {
      if (isPostgresAvailable()) {
        return undefined;
      }
      const products = readJson<Product[]>('products.json', []);
      return products.find(p => p.id === id);
    },
    create: (product: Product): Product => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.products.create() when Postgres is available');
      }
      const products = readJson<Product[]>('products.json', []);
      products.push(product);
      writeJson('products.json', products);
      return product;
    },
    update: (id: string, updates: Partial<Product>): Product | null => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.products.update() when Postgres is available');
      }
      const products = readJson<Product[]>('products.json', []);
      const index = products.findIndex(p => p.id === id);
      if (index === -1) return null;
      products[index] = { ...products[index], ...updates };
      writeJson('products.json', products);
      return products[index];
    },
    delete: (id: string): boolean => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.products.delete() when Postgres is available');
      }
      const products = readJson<Product[]>('products.json', []);
      const filtered = products.filter(p => p.id !== id);
      writeJson('products.json', filtered);
      return filtered.length < products.length;
    },
  },

  customers: {
    getAll: (): Customer[] => {
      if (isPostgresAvailable()) {
        return [];
      }
      return readJson('customers.json', []);
    },
    getById: (id: string): Customer | undefined => {
      if (isPostgresAvailable()) {
        return undefined;
      }
      const customers = readJson<Customer[]>('customers.json', []);
      return customers.find(c => c.id === id);
    },
    create: (customer: Customer): Customer => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.customers.create() when Postgres is available');
      }
      const customers = readJson<Customer[]>('customers.json', []);
      customers.push(customer);
      writeJson('customers.json', customers);
      return customer;
    },
    update: (id: string, updates: Partial<Customer>): Customer | null => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.customers.update() when Postgres is available');
      }
      const customers = readJson<Customer[]>('customers.json', []);
      const index = customers.findIndex(c => c.id === id);
      if (index === -1) return null;
      customers[index] = { ...customers[index], ...updates };
      writeJson('customers.json', customers);
      return customers[index];
    },
    delete: (id: string): boolean => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.customers.delete() when Postgres is available');
      }
      const customers = readJson<Customer[]>('customers.json', []);
      const filtered = customers.filter(c => c.id !== id);
      writeJson('customers.json', filtered);
      return filtered.length < customers.length;
    },
  },

  paymentMethods: {
    getAll: (): PaymentMethod[] => {
      if (isPostgresAvailable()) {
        return [];
      }
      return readJson('paymentMethods.json', []);
    },
    create: (method: PaymentMethod): PaymentMethod => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.paymentMethods.create() when Postgres is available');
      }
      const methods = readJson<PaymentMethod[]>('paymentMethods.json', []);
      methods.push(method);
      writeJson('paymentMethods.json', methods);
      return method;
    },
    update: (id: string, updates: Partial<PaymentMethod>): PaymentMethod | null => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.paymentMethods.update() when Postgres is available');
      }
      const methods = readJson<PaymentMethod[]>('paymentMethods.json', []);
      const index = methods.findIndex(m => m.id === id);
      if (index === -1) return null;
      methods[index] = { ...methods[index], ...updates };
      writeJson('paymentMethods.json', methods);
      return methods[index];
    },
    delete: (id: string): boolean => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.paymentMethods.delete() when Postgres is available');
      }
      const methods = readJson<PaymentMethod[]>('paymentMethods.json', []);
      const filtered = methods.filter(m => m.id !== id);
      writeJson('paymentMethods.json', filtered);
      return filtered.length < methods.length;
    },
  },

  deliveryMethods: {
    getAll: (): DeliveryMethod[] => {
      if (isPostgresAvailable()) {
        return [];
      }
      return readJson('deliveryMethods.json', []);
    },
    create: (method: DeliveryMethod): DeliveryMethod => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.deliveryMethods.create() when Postgres is available');
      }
      const methods = readJson<DeliveryMethod[]>('deliveryMethods.json', []);
      methods.push(method);
      writeJson('deliveryMethods.json', methods);
      return method;
    },
    update: (id: string, updates: Partial<DeliveryMethod>): DeliveryMethod | null => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.deliveryMethods.update() when Postgres is available');
      }
      const methods = readJson<DeliveryMethod[]>('deliveryMethods.json', []);
      const index = methods.findIndex(m => m.id === id);
      if (index === -1) return null;
      methods[index] = { ...methods[index], ...updates };
      writeJson('deliveryMethods.json', methods);
      return methods[index];
    },
    delete: (id: string): boolean => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.deliveryMethods.delete() when Postgres is available');
      }
      const methods = readJson<DeliveryMethod[]>('deliveryMethods.json', []);
      const filtered = methods.filter(m => m.id !== id);
      writeJson('deliveryMethods.json', filtered);
      return filtered.length < methods.length;
    },
  },

  banners: {
    getAll: (): Banner[] => {
      if (isPostgresAvailable()) {
        return [];
      }
      return readJson('banners.json', []);
    },
    create: (banner: Banner): Banner => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.banners.create() when Postgres is available');
      }
      const banners = readJson<Banner[]>('banners.json', []);
      banners.push(banner);
      writeJson('banners.json', banners);
      return banner;
    },
    update: (id: string, updates: Partial<Banner>): Banner | null => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.banners.update() when Postgres is available');
      }
      const banners = readJson<Banner[]>('banners.json', []);
      const index = banners.findIndex(b => b.id === id);
      if (index === -1) return null;
      banners[index] = { ...banners[index], ...updates };
      writeJson('banners.json', banners);
      return banners[index];
    },
    delete: (id: string): boolean => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.banners.delete() when Postgres is available');
      }
      const banners = readJson<Banner[]>('banners.json', []);
      const filtered = banners.filter(b => b.id !== id);
      writeJson('banners.json', filtered);
      return filtered.length < banners.length;
    },
  },

  links: {
    getAll: (): ClickableLink[] => {
      if (isPostgresAvailable()) {
        return [];
      }
      return readJson('links.json', []);
    },
    create: (link: ClickableLink): ClickableLink => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.links.create() when Postgres is available');
      }
      const links = readJson<ClickableLink[]>('links.json', []);
      links.push(link);
      writeJson('links.json', links);
      return link;
    },
    update: (id: string, updates: Partial<ClickableLink>): ClickableLink | null => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.links.update() when Postgres is available');
      }
      const links = readJson<ClickableLink[]>('links.json', []);
      const index = links.findIndex(l => l.id === id);
      if (index === -1) return null;
      links[index] = { ...links[index], ...updates };
      writeJson('links.json', links);
      return links[index];
    },
    delete: (id: string): boolean => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.links.delete() when Postgres is available');
      }
      const links = readJson<ClickableLink[]>('links.json', []);
      const filtered = links.filter(l => l.id !== id);
      writeJson('links.json', filtered);
      return filtered.length < links.length;
    },
  },

  gallery: {
    getAll: (): GalleryImage[] => {
      if (isPostgresAvailable()) {
        return [];
      }
      return readJson('gallery.json', []);
    },
    create: (image: GalleryImage): GalleryImage => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.gallery.create() when Postgres is available');
      }
      const images = readJson<GalleryImage[]>('gallery.json', []);
      images.push(image);
      writeJson('gallery.json', images);
      return image;
    },
    update: (id: string, updates: Partial<GalleryImage>): GalleryImage | null => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.gallery.update() when Postgres is available');
      }
      const images = readJson<GalleryImage[]>('gallery.json', []);
      const index = images.findIndex(img => img.id === id);
      if (index === -1) return null;
      images[index] = { ...images[index], ...updates };
      writeJson('gallery.json', images);
      return images[index];
    },
    delete: (id: string): boolean => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.gallery.delete() when Postgres is available');
      }
      const images = readJson<GalleryImage[]>('gallery.json', []);
      const filtered = images.filter(img => img.id !== id);
      writeJson('gallery.json', filtered);
      return filtered.length < images.length;
    },
  },

  videos: {
    getAll: (): Video[] => {
      if (isPostgresAvailable()) {
        return [];
      }
      return readJson('videos.json', []);
    },
    create: (video: Video): Video => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.videos.create() when Postgres is available');
      }
      const videos = readJson<Video[]>('videos.json', []);
      videos.push(video);
      writeJson('videos.json', videos);
      return video;
    },
    update: (id: string, updates: Partial<Video>): Video | null => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.videos.update() when Postgres is available');
      }
      const videos = readJson<Video[]>('videos.json', []);
      const index = videos.findIndex(v => v.id === id);
      if (index === -1) return null;
      videos[index] = { ...videos[index], ...updates };
      writeJson('videos.json', videos);
      return videos[index];
    },
    delete: (id: string): boolean => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.videos.delete() when Postgres is available');
      }
      const videos = readJson<Video[]>('videos.json', []);
      const filtered = videos.filter(v => v.id !== id);
      writeJson('videos.json', filtered);
      return filtered.length < videos.length;
    },
  },

  config: {
    get: (): SiteConfig => {
      if (isPostgresAvailable()) {
        // Return default - API routes should use async
        return {
          whatsappNumber: '',
          email: '',
          socialMedia: {},
          mercadoPagoAccessToken: '',
          mercadoPagoPublicKey: '',
        };
      }
      return readJson('config.json', {
        whatsappNumber: '',
        email: '',
        socialMedia: {},
        mercadoPagoAccessToken: '',
        mercadoPagoPublicKey: '',
      });
    },
    update: (updates: Partial<SiteConfig>): SiteConfig => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.config.update() when Postgres is available');
      }
      const config = readJson<SiteConfig>('config.json', {
        whatsappNumber: '',
        email: '',
        socialMedia: {},
        mercadoPagoAccessToken: '',
        mercadoPagoPublicKey: '',
      });
      const updated = { ...config, ...updates };
      writeJson('config.json', updated);
      return updated;
    },
  },

  orders: {
    getAll: (): Order[] => {
      if (isPostgresAvailable()) {
        return [];
      }
      return readJson('orders.json', []);
    },
    getById: (id: string): Order | undefined => {
      if (isPostgresAvailable()) {
        return undefined;
      }
      const orders = readJson<Order[]>('orders.json', []);
      return orders.find(o => o.id === id);
    },
    create: (order: Order): Order => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.orders.create() when Postgres is available');
      }
      const orders = readJson<Order[]>('orders.json', []);
      orders.push(order);
      writeJson('orders.json', orders);
      return order;
    },
    update: (id: string, updates: Partial<Order>): Order | null => {
      if (isPostgresAvailable()) {
        throw new Error('Use async dbPostgres.orders.update() when Postgres is available');
      }
      const orders = readJson<Order[]>('orders.json', []);
      const index = orders.findIndex(o => o.id === id);
      if (index === -1) return null;
      orders[index] = { ...orders[index], ...updates };
      writeJson('orders.json', orders);
      return orders[index];
    },
    getByPaymentId: (paymentId: string): Order | undefined => {
      if (isPostgresAvailable()) {
        return undefined;
      }
      const orders = readJson<Order[]>('orders.json', []);
      return orders.find(o => o.mercadoPagoPaymentId === paymentId || o.paymentId === paymentId);
    },
  },
};

// Export Postgres DB for use in API routes
export { dbPostgres, isPostgresAvailable };
