-- Database schema for Do Santos Market
-- Run this script in your Vercel Postgres/Neon database

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  parent_id VARCHAR(255),
  image TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  images JSONB DEFAULT '[]'::jsonb,
  video TEXT,
  category_id VARCHAR(255) NOT NULL,
  subcategory_id VARCHAR(255),
  sku VARCHAR(255) NOT NULL,
  stock INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  cpf VARCHAR(255),
  addresses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  active BOOLEAN DEFAULT true,
  installments INTEGER,
  fee DECIMAL(10, 2)
);

-- Delivery methods table
CREATE TABLE IF NOT EXISTS delivery_methods (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  estimated_days INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  free_shipping_threshold DECIMAL(10, 2)
);

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image TEXT NOT NULL,
  link TEXT,
  "order" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  position VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Links table
CREATE TABLE IF NOT EXISTS links (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  "order" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gallery images table
CREATE TABLE IF NOT EXISTS gallery_images (
  id VARCHAR(255) PRIMARY KEY,
  url TEXT NOT NULL,
  alt VARCHAR(255),
  "order" INTEGER DEFAULT 0,
  category VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  thumbnail TEXT,
  "order" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Site config table
CREATE TABLE IF NOT EXISTS site_config (
  id VARCHAR(255) PRIMARY KEY DEFAULT 'config',
  whatsapp_number VARCHAR(255) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  social_media JSONB DEFAULT '{}'::jsonb,
  mercado_pago_access_token TEXT DEFAULT '',
  mercado_pago_public_key TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(255) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(255) NOT NULL,
  customer_cpf VARCHAR(255),
  address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_fee DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(255) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_id VARCHAR(255),
  mercado_pago_payment_id VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(mercado_pago_payment_id);
