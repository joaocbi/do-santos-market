import { Product } from './types';

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

const CART_STORAGE_KEY = 'do-santos-market-cart';

export const cartUtils = {
  getCart: (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const cart = localStorage.getItem(CART_STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
      return [];
    }
  },

  addToCart: (product: Product, quantity: number = 1): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const cart = cartUtils.getCart();
      const existingItemIndex = cart.findIndex(item => item.productId === product.id);

      if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += quantity;
      } else {
        cart.push({
          productId: product.id,
          quantity,
          product,
        });
      }

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  },

  removeFromCart: (productId: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const cart = cartUtils.getCart();
      const filteredCart = cart.filter(item => item.productId !== productId);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filteredCart));
      
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  },

  updateQuantity: (productId: string, quantity: number): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const cart = cartUtils.getCart();
      const itemIndex = cart.findIndex(item => item.productId === productId);

      if (itemIndex >= 0) {
        if (quantity <= 0) {
          cartUtils.removeFromCart(productId);
        } else {
          cart[itemIndex].quantity = quantity;
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
          window.dispatchEvent(new Event('cartUpdated'));
        }
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
    }
  },

  clearCart: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new Event('cartUpdated'));
  },

  getCartCount: (): number => {
    const cart = cartUtils.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },

  getCartTotal: (): number => {
    const cart = cartUtils.getCart();
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  },
};
