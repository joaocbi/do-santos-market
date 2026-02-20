import { neon } from '@neondatabase/serverless';
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

// Helper to check if Postgres is available
export const isPostgresAvailable = (): boolean => {
  return !!process.env.POSTGRES_URL;
};

// Lazy initialization of SQL connection to avoid build-time errors
let sqlInstance: ReturnType<typeof neon> | null = null;

function getSql() {
  if (!sqlInstance) {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL is not configured');
    }
    sqlInstance = neon(connectionString);
  }
  return sqlInstance;
}

// Database operations using Postgres
export const dbPostgres = {
  categories: {
    getAll: async (): Promise<Category[]> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, name, slug, parent_id as "parentId", image, "order"
        FROM categories
        ORDER BY "order" ASC
      `) as any[];
      return result.map((row: any) => ({
        ...row,
        subcategories: [],
      })) as Category[];
    },
    getById: async (id: string): Promise<Category | undefined> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, name, slug, parent_id as "parentId", image, "order"
        FROM categories
        WHERE id = ${id}
        LIMIT 1
      `) as any[];
      if (result.length === 0) return undefined;
      const row = result[0] as any;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        parentId: row.parentId,
        image: row.image,
        order: row.order,
        subcategories: []
      };
    },
    create: async (category: Category): Promise<Category> => {
      const sql = getSql();
      await sql`
        INSERT INTO categories (id, name, slug, parent_id, image, "order")
        VALUES (${category.id}, ${category.name}, ${category.slug}, ${category.parentId || null}, ${category.image || null}, ${category.order})
      `;
      return category;
    },
    update: async (id: string, updates: Partial<Category>): Promise<Category | null> => {
      const existing = await dbPostgres.categories.getById(id);
      if (!existing) return null;

      const updated = { ...existing, ...updates };
      const sql = getSql();
      await sql`
        UPDATE categories
        SET name = ${updated.name},
            slug = ${updated.slug},
            parent_id = ${updated.parentId || null},
            image = ${updated.image || null},
            "order" = ${updated.order},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      const sql = getSql();
      await sql`DELETE FROM categories WHERE id = ${id}`;
      // Check if deletion was successful by trying to get the record
      const check = (await sql`SELECT id FROM categories WHERE id = ${id} LIMIT 1`) as any[];
      return check.length === 0;
    },
  },

  products: {
    getAll: async (): Promise<Product[]> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, name, description, price, original_price as "originalPrice", cost_price as "costPrice",
               images, video, category_id as "categoryId", subcategory_id as "subcategoryId",
               sku, stock, active, featured, observations, created_at as "createdAt", updated_at as "updatedAt"
        FROM products
        ORDER BY created_at DESC
      `) as any[];
      return result as Product[];
    },
    getById: async (id: string): Promise<Product | undefined> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, name, description, price, original_price as "originalPrice", cost_price as "costPrice",
               images, video, category_id as "categoryId", subcategory_id as "subcategoryId",
               sku, stock, active, featured, observations, created_at as "createdAt", updated_at as "updatedAt"
        FROM products
        WHERE id = ${id}
        LIMIT 1
      `) as any[];
      return result[0] as Product | undefined;
    },
    create: async (product: Product): Promise<Product> => {
      const sql = getSql();
      await sql`
        INSERT INTO products (id, name, description, price, original_price, cost_price, images, video,
                             category_id, subcategory_id, sku, stock, active, featured, observations, created_at, updated_at)
        VALUES (${product.id}, ${product.name}, ${product.description || ''}, ${product.price},
                ${product.originalPrice || null}, ${product.costPrice || null},
                ${JSON.stringify(product.images)}::jsonb, ${product.video || null},
                ${product.categoryId}, ${product.subcategoryId || null}, ${product.sku},
                ${product.stock}, ${product.active}, ${product.featured}, ${product.observations || null},
                ${product.createdAt}, ${product.updatedAt})
      `;
      return product;
    },
    update: async (id: string, updates: Partial<Product>): Promise<Product | null> => {
      const existing = await dbPostgres.products.getById(id);
      if (!existing) return null;

      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      const sql = getSql();
      await sql`
        UPDATE products
        SET name = ${updated.name},
            description = ${updated.description || ''},
            price = ${updated.price},
            original_price = ${updated.originalPrice || null},
            cost_price = ${updated.costPrice || null},
            images = ${JSON.stringify(updated.images)}::jsonb,
            video = ${updated.video || null},
            category_id = ${updated.categoryId},
            subcategory_id = ${updated.subcategoryId || null},
            sku = ${updated.sku},
            stock = ${updated.stock},
            active = ${updated.active},
            featured = ${updated.featured},
            observations = ${updated.observations || null},
            updated_at = ${updated.updatedAt}
        WHERE id = ${id}
      `;
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      const sql = getSql();
      await sql`DELETE FROM products WHERE id = ${id}`;
      // Check if deletion was successful by trying to get the record
      const check = (await sql`SELECT id FROM products WHERE id = ${id} LIMIT 1`) as any[];
      return check.length === 0;
    },
  },

  customers: {
    getAll: async (): Promise<Customer[]> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, name, email, phone, cpf, addresses, created_at as "createdAt"
        FROM customers
        ORDER BY created_at DESC
      `) as any[];
      return result as Customer[];
    },
    getById: async (id: string): Promise<Customer | undefined> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, name, email, phone, cpf, addresses, created_at as "createdAt"
        FROM customers
        WHERE id = ${id}
        LIMIT 1
      `) as any[];
      return result[0] as Customer | undefined;
    },
    create: async (customer: Customer): Promise<Customer> => {
      const sql = getSql();
      await sql`
        INSERT INTO customers (id, name, email, phone, cpf, addresses, created_at)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.phone},
                ${customer.cpf || null}, ${JSON.stringify(customer.address)}::jsonb, ${customer.createdAt})
      `;
      return customer;
    },
    update: async (id: string, updates: Partial<Customer>): Promise<Customer | null> => {
      const existing = await dbPostgres.customers.getById(id);
      if (!existing) return null;

      const updated = { ...existing, ...updates };
      const sql = getSql();
      await sql`
        UPDATE customers
        SET name = ${updated.name},
            email = ${updated.email},
            phone = ${updated.phone},
            cpf = ${updated.cpf || null},
            addresses = ${JSON.stringify(updated.address)}::jsonb
        WHERE id = ${id}
      `;
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      const sql = getSql();
      await sql`DELETE FROM customers WHERE id = ${id}`;
      const check = (await sql`SELECT id FROM customers WHERE id = ${id} LIMIT 1`) as any[];
      return check.length === 0;
    },
  },

  paymentMethods: {
    getAll: async (): Promise<PaymentMethod[]> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, name, type, active, installments, fee
        FROM payment_methods
        ORDER BY name
      `) as any[];
      return result as PaymentMethod[];
    },
    create: async (method: PaymentMethod): Promise<PaymentMethod> => {
      const sql = getSql();
      await sql`
        INSERT INTO payment_methods (id, name, type, active, installments, fee)
        VALUES (${method.id}, ${method.name}, ${method.type}, ${method.active},
                ${method.installments || null}, ${method.fee || null})
      `;
      return method;
    },
    update: async (id: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod | null> => {
      const existing = await dbPostgres.paymentMethods.getAll();
      const method = existing.find(m => m.id === id);
      if (!method) return null;

      const updated = { ...method, ...updates };
      const sql = getSql();
      await sql`
        UPDATE payment_methods
        SET name = ${updated.name},
            type = ${updated.type},
            active = ${updated.active},
            installments = ${updated.installments || null},
            fee = ${updated.fee || null}
        WHERE id = ${id}
      `;
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      const sql = getSql();
      await sql`DELETE FROM payment_methods WHERE id = ${id}`;
      const check = (await sql`SELECT id FROM payment_methods WHERE id = ${id} LIMIT 1`) as any[];
      return check.length === 0;
    },
  },

  deliveryMethods: {
    getAll: async (): Promise<DeliveryMethod[]> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, name, price, estimated_days as "estimatedDays", active, free_shipping_threshold as "freeShippingThreshold"
        FROM delivery_methods
        ORDER BY price
      `) as any[];
      return result as DeliveryMethod[];
    },
    create: async (method: DeliveryMethod): Promise<DeliveryMethod> => {
      const sql = getSql();
      await sql`
        INSERT INTO delivery_methods (id, name, price, estimated_days, active, free_shipping_threshold)
        VALUES (${method.id}, ${method.name}, ${method.price}, ${method.estimatedDays},
                ${method.active}, ${method.freeShippingThreshold || null})
      `;
      return method;
    },
    update: async (id: string, updates: Partial<DeliveryMethod>): Promise<DeliveryMethod | null> => {
      const existing = await dbPostgres.deliveryMethods.getAll();
      const method = existing.find(m => m.id === id);
      if (!method) return null;

      const updated = { ...method, ...updates };
      const sql = getSql();
      await sql`
        UPDATE delivery_methods
        SET name = ${updated.name},
            price = ${updated.price},
            estimated_days = ${updated.estimatedDays},
            active = ${updated.active},
            free_shipping_threshold = ${updated.freeShippingThreshold || null}
        WHERE id = ${id}
      `;
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      const sql = getSql();
      await sql`DELETE FROM delivery_methods WHERE id = ${id}`;
      const check = (await sql`SELECT id FROM delivery_methods WHERE id = ${id} LIMIT 1`) as any[];
      return check.length === 0;
    },
  },

  banners: {
    getAll: async (): Promise<Banner[]> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, title, image, link, "order", active, position
        FROM banners
        ORDER BY "order" ASC
      `) as any[];
      return result as Banner[];
    },
    create: async (banner: Banner): Promise<Banner> => {
      const sql = getSql();
      await sql`
        INSERT INTO banners (id, title, image, link, "order", active, position)
        VALUES (${banner.id}, ${banner.title}, ${banner.image}, ${banner.link || null},
                ${banner.order}, ${banner.active}, ${banner.position})
      `;
      return banner;
    },
    update: async (id: string, updates: Partial<Banner>): Promise<Banner | null> => {
      const existing = await dbPostgres.banners.getAll();
      const banner = existing.find(b => b.id === id);
      if (!banner) return null;

      const updated = { ...banner, ...updates, updatedAt: new Date().toISOString() };
      const sql = getSql();
      await sql`
        UPDATE banners
        SET title = ${updated.title},
            image = ${updated.image},
            link = ${updated.link || null},
            "order" = ${updated.order},
            active = ${updated.active},
            position = ${updated.position},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      const sql = getSql();
      await sql`DELETE FROM banners WHERE id = ${id}`;
      const check = (await sql`SELECT id FROM banners WHERE id = ${id} LIMIT 1`) as any[];
      return check.length === 0;
    },
  },

  links: {
    getAll: async (): Promise<ClickableLink[]> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, title, url, icon, "order", active
        FROM links
        ORDER BY "order" ASC
      `) as any[];
      return result as ClickableLink[];
    },
    create: async (link: ClickableLink): Promise<ClickableLink> => {
      const sql = getSql();
      await sql`
        INSERT INTO links (id, title, url, icon, "order", active)
        VALUES (${link.id}, ${link.title}, ${link.url}, ${link.icon || null},
                ${link.order}, ${link.active})
      `;
      return link;
    },
    update: async (id: string, updates: Partial<ClickableLink>): Promise<ClickableLink | null> => {
      const existing = await dbPostgres.links.getAll();
      const link = existing.find(l => l.id === id);
      if (!link) return null;

      const updated = { ...link, ...updates };
      const sql = getSql();
      await sql`
        UPDATE links
        SET title = ${updated.title},
            url = ${updated.url},
            icon = ${updated.icon || null},
            "order" = ${updated.order},
            active = ${updated.active},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      const sql = getSql();
      await sql`DELETE FROM links WHERE id = ${id}`;
      const check = (await sql`SELECT id FROM links WHERE id = ${id} LIMIT 1`) as any[];
      return check.length === 0;
    },
  },

  gallery: {
    getAll: async (): Promise<GalleryImage[]> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, url, alt, "order", category
        FROM gallery_images
        ORDER BY "order" ASC
      `) as any[];
      return result as GalleryImage[];
    },
    create: async (image: GalleryImage): Promise<GalleryImage> => {
      const sql = getSql();
      await sql`
        INSERT INTO gallery_images (id, url, alt, "order", category)
        VALUES (${image.id}, ${image.url}, ${image.alt}, ${image.order}, ${image.category || null})
      `;
      return image;
    },
    update: async (id: string, updates: Partial<GalleryImage>): Promise<GalleryImage | null> => {
      const existing = await dbPostgres.gallery.getAll();
      const image = existing.find(img => img.id === id);
      if (!image) return null;

      const updated = { ...image, ...updates };
      const sql = getSql();
      await sql`
        UPDATE gallery_images
        SET url = ${updated.url},
            alt = ${updated.alt},
            "order" = ${updated.order},
            category = ${updated.category || null},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      const sql = getSql();
      await sql`DELETE FROM gallery_images WHERE id = ${id}`;
      const check = (await sql`SELECT id FROM gallery_images WHERE id = ${id} LIMIT 1`) as any[];
      return check.length === 0;
    },
  },

  videos: {
    getAll: async (): Promise<Video[]> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, title, url, type, thumbnail, "order", active
        FROM videos
        ORDER BY "order" ASC
      `) as any[];
      return result as Video[];
    },
    create: async (video: Video): Promise<Video> => {
      const sql = getSql();
      await sql`
        INSERT INTO videos (id, title, url, type, thumbnail, "order", active)
        VALUES (${video.id}, ${video.title}, ${video.url}, ${video.type},
                ${video.thumbnail || null}, ${video.order}, ${video.active})
      `;
      return video;
    },
    update: async (id: string, updates: Partial<Video>): Promise<Video | null> => {
      const existing = await dbPostgres.videos.getAll();
      const video = existing.find(v => v.id === id);
      if (!video) return null;

      const updated = { ...video, ...updates };
      const sql = getSql();
      await sql`
        UPDATE videos
        SET title = ${updated.title},
            url = ${updated.url},
            type = ${updated.type},
            thumbnail = ${updated.thumbnail || null},
            "order" = ${updated.order},
            active = ${updated.active},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      const sql = getSql();
      await sql`DELETE FROM videos WHERE id = ${id}`;
      const check = (await sql`SELECT id FROM videos WHERE id = ${id} LIMIT 1`) as any[];
      return check.length === 0;
    },
  },

  config: {
    get: async (): Promise<SiteConfig> => {
      const sql = getSql();
      const result = (await sql`
        SELECT whatsapp_number as "whatsappNumber", email, social_media as "socialMedia",
               mercado_pago_access_token as "mercadoPagoAccessToken",
               mercado_pago_public_key as "mercadoPagoPublicKey"
        FROM site_config
        WHERE id = 'config'
        LIMIT 1
      `) as any[];
      if (result.length === 0) {
        // Initialize default config
        const defaultConfig: SiteConfig = {
          whatsappNumber: '',
          email: '',
          socialMedia: {},
          mercadoPagoAccessToken: '',
          mercadoPagoPublicKey: '',
        };
        const sql = getSql();
        await sql`
          INSERT INTO site_config (id, whatsapp_number, email, social_media, mercado_pago_access_token, mercado_pago_public_key)
          VALUES ('config', '', '', '{}'::jsonb, '', '')
        `;
        return defaultConfig;
      }
      return result[0] as SiteConfig;
    },
    update: async (updates: Partial<SiteConfig>): Promise<SiteConfig> => {
      const current = await dbPostgres.config.get();
      const updated = { ...current, ...updates };
      const sql = getSql();
      await sql`
        UPDATE site_config
        SET whatsapp_number = ${updated.whatsappNumber},
            email = ${updated.email},
            social_media = ${JSON.stringify(updated.socialMedia)}::jsonb,
            mercado_pago_access_token = ${updated.mercadoPagoAccessToken || ''},
            mercado_pago_public_key = ${updated.mercadoPagoPublicKey || ''},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 'config'
      `;
      return updated;
    },
  },

  orders: {
    getAll: async (): Promise<Order[]> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, customer_name as "customerName", customer_email as "customerEmail",
               customer_phone as "customerPhone", customer_cpf as "customerCpf",
               address, items, subtotal, shipping_fee as "shippingFee", total,
               payment_method as "paymentMethod", payment_status as "paymentStatus",
               payment_id as "paymentId", mercado_pago_payment_id as "mercadoPagoPaymentId",
               notes, status, created_at as "createdAt", updated_at as "updatedAt"
        FROM orders
        ORDER BY created_at DESC
      `) as any[];
      return result as Order[];
    },
    getById: async (id: string): Promise<Order | undefined> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, customer_name as "customerName", customer_email as "customerEmail",
               customer_phone as "customerPhone", customer_cpf as "customerCpf",
               address, items, subtotal, shipping_fee as "shippingFee", total,
               payment_method as "paymentMethod", payment_status as "paymentStatus",
               payment_id as "paymentId", mercado_pago_payment_id as "mercadoPagoPaymentId",
               notes, status, created_at as "createdAt", updated_at as "updatedAt"
        FROM orders
        WHERE id = ${id}
        LIMIT 1
      `) as any[];
      return result[0] as Order | undefined;
    },
    create: async (order: Order): Promise<Order> => {
      try {
        console.log('Inserting order into Postgres:', {
          id: order.id,
          customerName: order.customerName,
          total: order.total
        });
        
        const sql = getSql();
        await sql`
          INSERT INTO orders (id, customer_name, customer_email, customer_phone, customer_cpf,
                            address, items, subtotal, shipping_fee, total, payment_method,
                            payment_status, payment_id, mercado_pago_payment_id, notes, status, created_at, updated_at)
          VALUES (${order.id}, ${order.customerName}, ${order.customerEmail}, ${order.customerPhone},
                  ${order.customerCpf || null}, ${JSON.stringify(order.address)}::jsonb,
                  ${JSON.stringify(order.items)}::jsonb, ${order.subtotal}, ${order.shippingFee},
                  ${order.total}, ${order.paymentMethod}, ${order.paymentStatus},
                  ${order.paymentId || null}, ${order.mercadoPagoPaymentId || null},
                  ${order.notes || null}, ${order.status}, ${order.createdAt}, ${order.updatedAt})
        `;
        
        console.log('Order inserted successfully:', order.id);
        return order;
      } catch (error: any) {
        console.error('Error inserting order:', error);
        console.error('Order data:', JSON.stringify(order, null, 2));
        throw error;
      }
    },
    update: async (id: string, updates: Partial<Order>): Promise<Order | null> => {
      const existing = await dbPostgres.orders.getById(id);
      if (!existing) return null;

      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      const sql = getSql();
      await sql`
        UPDATE orders
        SET customer_name = ${updated.customerName},
            customer_email = ${updated.customerEmail},
            customer_phone = ${updated.customerPhone},
            customer_cpf = ${updated.customerCpf || null},
            address = ${JSON.stringify(updated.address)}::jsonb,
            items = ${JSON.stringify(updated.items)}::jsonb,
            subtotal = ${updated.subtotal},
            shipping_fee = ${updated.shippingFee},
            total = ${updated.total},
            payment_method = ${updated.paymentMethod},
            payment_status = ${updated.paymentStatus},
            payment_id = ${updated.paymentId || null},
            mercado_pago_payment_id = ${updated.mercadoPagoPaymentId || null},
            notes = ${updated.notes || null},
            status = ${updated.status},
            updated_at = ${updated.updatedAt}
        WHERE id = ${id}
      `;
      return updated;
    },
    getByPaymentId: async (paymentId: string): Promise<Order | undefined> => {
      const sql = getSql();
      const result = (await sql`
        SELECT id, customer_name as "customerName", customer_email as "customerEmail",
               customer_phone as "customerPhone", customer_cpf as "customerCpf",
               address, items, subtotal, shipping_fee as "shippingFee", total,
               payment_method as "paymentMethod", payment_status as "paymentStatus",
               payment_id as "paymentId", mercado_pago_payment_id as "mercadoPagoPaymentId",
               notes, status, created_at as "createdAt", updated_at as "updatedAt"
        FROM orders
        WHERE mercado_pago_payment_id = ${paymentId} OR payment_id = ${paymentId}
        LIMIT 1
      `) as any[];
      return result[0] as Order | undefined;
    },
  },
};
