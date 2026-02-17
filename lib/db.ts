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
} from './types';

const dbPath = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

const getDbFile = (filename: string) => path.join(dbPath, filename);

const readJson = <T>(filename: string, defaultValue: T): T => {
  const filePath = getDbFile(filename);
  if (!fs.existsSync(filePath)) {
    writeJson(filename, defaultValue);
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
  const filePath = getDbFile(filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// Database operations
export const db = {
  categories: {
    getAll: (): Category[] => readJson('categories.json', []),
    getById: (id: string): Category | undefined => {
      const categories = readJson<Category[]>('categories.json', []);
      return categories.find(c => c.id === id);
    },
    create: (category: Category): Category => {
      const categories = readJson<Category[]>('categories.json', []);
      categories.push(category);
      writeJson('categories.json', categories);
      return category;
    },
    update: (id: string, updates: Partial<Category>): Category | null => {
      const categories = readJson<Category[]>('categories.json', []);
      const index = categories.findIndex(c => c.id === id);
      if (index === -1) return null;
      categories[index] = { ...categories[index], ...updates };
      writeJson('categories.json', categories);
      return categories[index];
    },
    delete: (id: string): boolean => {
      const categories = readJson<Category[]>('categories.json', []);
      const filtered = categories.filter(c => c.id !== id);
      writeJson('categories.json', filtered);
      return filtered.length < categories.length;
    },
  },

  products: {
    getAll: (): Product[] => readJson('products.json', []),
    getById: (id: string): Product | undefined => {
      const products = readJson<Product[]>('products.json', []);
      return products.find(p => p.id === id);
    },
    create: (product: Product): Product => {
      const products = readJson<Product[]>('products.json', []);
      products.push(product);
      writeJson('products.json', products);
      return product;
    },
    update: (id: string, updates: Partial<Product>): Product | null => {
      const products = readJson<Product[]>('products.json', []);
      const index = products.findIndex(p => p.id === id);
      if (index === -1) return null;
      products[index] = { ...products[index], ...updates };
      writeJson('products.json', products);
      return products[index];
    },
    delete: (id: string): boolean => {
      const products = readJson<Product[]>('products.json', []);
      const filtered = products.filter(p => p.id !== id);
      writeJson('products.json', filtered);
      return filtered.length < products.length;
    },
  },

  customers: {
    getAll: (): Customer[] => readJson('customers.json', []),
    getById: (id: string): Customer | undefined => {
      const customers = readJson<Customer[]>('customers.json', []);
      return customers.find(c => c.id === id);
    },
    create: (customer: Customer): Customer => {
      const customers = readJson<Customer[]>('customers.json', []);
      customers.push(customer);
      writeJson('customers.json', customers);
      return customer;
    },
    update: (id: string, updates: Partial<Customer>): Customer | null => {
      const customers = readJson<Customer[]>('customers.json', []);
      const index = customers.findIndex(c => c.id === id);
      if (index === -1) return null;
      customers[index] = { ...customers[index], ...updates };
      writeJson('customers.json', customers);
      return customers[index];
    },
    delete: (id: string): boolean => {
      const customers = readJson<Customer[]>('customers.json', []);
      const filtered = customers.filter(c => c.id !== id);
      writeJson('customers.json', filtered);
      return filtered.length < customers.length;
    },
  },

  paymentMethods: {
    getAll: (): PaymentMethod[] => readJson('paymentMethods.json', []),
    create: (method: PaymentMethod): PaymentMethod => {
      const methods = readJson<PaymentMethod[]>('paymentMethods.json', []);
      methods.push(method);
      writeJson('paymentMethods.json', methods);
      return method;
    },
    update: (id: string, updates: Partial<PaymentMethod>): PaymentMethod | null => {
      const methods = readJson<PaymentMethod[]>('paymentMethods.json', []);
      const index = methods.findIndex(m => m.id === id);
      if (index === -1) return null;
      methods[index] = { ...methods[index], ...updates };
      writeJson('paymentMethods.json', methods);
      return methods[index];
    },
    delete: (id: string): boolean => {
      const methods = readJson<PaymentMethod[]>('paymentMethods.json', []);
      const filtered = methods.filter(m => m.id !== id);
      writeJson('paymentMethods.json', filtered);
      return filtered.length < methods.length;
    },
  },

  deliveryMethods: {
    getAll: (): DeliveryMethod[] => readJson('deliveryMethods.json', []),
    create: (method: DeliveryMethod): DeliveryMethod => {
      const methods = readJson<DeliveryMethod[]>('deliveryMethods.json', []);
      methods.push(method);
      writeJson('deliveryMethods.json', methods);
      return method;
    },
    update: (id: string, updates: Partial<DeliveryMethod>): DeliveryMethod | null => {
      const methods = readJson<DeliveryMethod[]>('deliveryMethods.json', []);
      const index = methods.findIndex(m => m.id === id);
      if (index === -1) return null;
      methods[index] = { ...methods[index], ...updates };
      writeJson('deliveryMethods.json', methods);
      return methods[index];
    },
    delete: (id: string): boolean => {
      const methods = readJson<DeliveryMethod[]>('deliveryMethods.json', []);
      const filtered = methods.filter(m => m.id !== id);
      writeJson('deliveryMethods.json', filtered);
      return filtered.length < methods.length;
    },
  },

  banners: {
    getAll: (): Banner[] => readJson('banners.json', []),
    create: (banner: Banner): Banner => {
      const banners = readJson<Banner[]>('banners.json', []);
      banners.push(banner);
      writeJson('banners.json', banners);
      return banner;
    },
    update: (id: string, updates: Partial<Banner>): Banner | null => {
      const banners = readJson<Banner[]>('banners.json', []);
      const index = banners.findIndex(b => b.id === id);
      if (index === -1) return null;
      banners[index] = { ...banners[index], ...updates };
      writeJson('banners.json', banners);
      return banners[index];
    },
    delete: (id: string): boolean => {
      const banners = readJson<Banner[]>('banners.json', []);
      const filtered = banners.filter(b => b.id !== id);
      writeJson('banners.json', filtered);
      return filtered.length < banners.length;
    },
  },

  links: {
    getAll: (): ClickableLink[] => readJson('links.json', []),
    create: (link: ClickableLink): ClickableLink => {
      const links = readJson<ClickableLink[]>('links.json', []);
      links.push(link);
      writeJson('links.json', links);
      return link;
    },
    update: (id: string, updates: Partial<ClickableLink>): ClickableLink | null => {
      const links = readJson<ClickableLink[]>('links.json', []);
      const index = links.findIndex(l => l.id === id);
      if (index === -1) return null;
      links[index] = { ...links[index], ...updates };
      writeJson('links.json', links);
      return links[index];
    },
    delete: (id: string): boolean => {
      const links = readJson<ClickableLink[]>('links.json', []);
      const filtered = links.filter(l => l.id !== id);
      writeJson('links.json', filtered);
      return filtered.length < links.length;
    },
  },

  gallery: {
    getAll: (): GalleryImage[] => readJson('gallery.json', []),
    create: (image: GalleryImage): GalleryImage => {
      const images = readJson<GalleryImage[]>('gallery.json', []);
      images.push(image);
      writeJson('gallery.json', images);
      return image;
    },
    update: (id: string, updates: Partial<GalleryImage>): GalleryImage | null => {
      const images = readJson<GalleryImage[]>('gallery.json', []);
      const index = images.findIndex(img => img.id === id);
      if (index === -1) return null;
      images[index] = { ...images[index], ...updates };
      writeJson('gallery.json', images);
      return images[index];
    },
    delete: (id: string): boolean => {
      const images = readJson<GalleryImage[]>('gallery.json', []);
      const filtered = images.filter(img => img.id !== id);
      writeJson('gallery.json', filtered);
      return filtered.length < images.length;
    },
  },

  videos: {
    getAll: (): Video[] => readJson('videos.json', []),
    create: (video: Video): Video => {
      const videos = readJson<Video[]>('videos.json', []);
      videos.push(video);
      writeJson('videos.json', videos);
      return video;
    },
    update: (id: string, updates: Partial<Video>): Video | null => {
      const videos = readJson<Video[]>('videos.json', []);
      const index = videos.findIndex(v => v.id === id);
      if (index === -1) return null;
      videos[index] = { ...videos[index], ...updates };
      writeJson('videos.json', videos);
      return videos[index];
    },
    delete: (id: string): boolean => {
      const videos = readJson<Video[]>('videos.json', []);
      const filtered = videos.filter(v => v.id !== id);
      writeJson('videos.json', filtered);
      return filtered.length < videos.length;
    },
  },

  config: {
    get: (): SiteConfig => readJson('config.json', {
      whatsappNumber: '',
      email: '',
      socialMedia: {},
    }),
    update: (updates: Partial<SiteConfig>): SiteConfig => {
      const config = readJson<SiteConfig>('config.json', {
        whatsappNumber: '',
        email: '',
        socialMedia: {},
      });
      const updated = { ...config, ...updates };
      writeJson('config.json', updated);
      return updated;
    },
  },
};
