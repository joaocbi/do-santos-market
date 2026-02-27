'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiMenu, FiX, FiSearch, FiShoppingBag, FiUser } from 'react-icons/fi';
import { Category, ClickableLink } from '@/lib/types';
import { cartUtils } from '@/lib/cart';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<ClickableLink[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    setIsLoadingCategories(true);
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingCategories(false));

    fetch('/api/links')
      .then(res => res.json())
      .then(data => setLinks(data))
      .catch(console.error);

    const updateCartCount = () => {
      setCartCount(cartUtils.getCartCount());
    };

    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-2 sm:py-3 border-b gap-2">
          <button
            className="lg:hidden flex-shrink-0"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? <FiX size={20} className="sm:w-6 sm:h-6" /> : <FiMenu size={20} className="sm:w-6 sm:h-6" />}
          </button>

          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1 max-w-full overflow-hidden">
            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.jpeg" 
                alt="Logo" 
                className="h-full w-full object-contain"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
                onLoad={() => setLogoLoaded(true)}
                onError={(e) => {
                  setLogoError(true);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            {logoError && (
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 bg-gradient-to-r from-gold to-gold-light rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm md:text-base">DS</span>
              </div>
            )}
            <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent truncate min-w-0">
              Do Santos Market
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            <button className="hidden md:block" aria-label="Buscar">
              <FiSearch size={20} />
            </button>
            <Link href="/cart" className="relative" aria-label="Carrinho">
              <FiShoppingBag size={18} className="sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center min-w-[20px]">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
            <Link href="/account" aria-label="Conta">
              <FiUser size={18} className="sm:w-5 sm:h-5" />
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`${isMenuOpen ? 'block' : 'hidden'} lg:block border-t lg:border-t-0 py-4`}>
          <ul className="list-none flex flex-col lg:flex-row gap-4 lg:gap-6">
            <li>
              <Link
                href="/"
                className="font-medium hover:text-primary transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Início
              </Link>
            </li>
            {categories.map(category => (
              <li key={category.id} className="relative group">
                <Link
                  href={`/category/${category.slug}`}
                  className="font-medium hover:text-primary transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
                {category.subcategories && category.subcategories.length > 0 && (
                  <ul className="hidden group-hover:block absolute top-full left-0 bg-white shadow-lg rounded p-4 min-w-[200px] mt-2 z-50">
                    {category.subcategories.map(sub => (
                      <li key={sub.id}>
                        <Link
                          href={`/category/${sub.slug}`}
                          className="block py-2 hover:text-primary"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {isLoadingCategories && categories.length === 0 && (
              <li className="text-gray-400 text-sm">Carregando categorias...</li>
            )}
            {links.map(link => (
              <li key={link.id}>
                <Link
                  href={link.url}
                  target="_blank"
                  className="font-medium hover:text-primary transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
