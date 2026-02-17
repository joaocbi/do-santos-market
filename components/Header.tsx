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

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);

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
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-3 border-b">
          <button
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/logo.jpeg" 
              alt="Logo" 
              className="h-12 md:h-14 w-auto object-contain"
              onLoad={() => setLogoLoaded(true)}
              onError={(e) => {
                setLogoError(true);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            {logoError && (
              <div className="h-12 md:h-14 w-12 md:w-14 bg-gradient-to-r from-gold to-gold-light rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">DS</span>
              </div>
            )}
            <span className="text-2xl font-bold bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
              Do Santos Market
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <button className="hidden md:block">
              <FiSearch size={20} />
            </button>
            <Link href="/cart" className="relative">
              <FiShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
            <Link href="/account">
              <FiUser size={20} />
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`${isMenuOpen ? 'block' : 'hidden'} lg:block py-4`}>
          <ul className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            <li>
              <Link
                href="/"
                className="font-medium hover:text-primary transition"
              >
                Início
              </Link>
            </li>
            {categories.map(category => (
              <li key={category.id} className="relative group">
                <Link
                  href={`/category/${category.slug}`}
                  className="font-medium hover:text-primary transition"
                >
                  {category.name}
                </Link>
                {category.subcategories && category.subcategories.length > 0 && (
                  <ul className="hidden group-hover:block absolute top-full left-0 bg-white shadow-lg rounded p-4 min-w-[200px] mt-2">
                    {category.subcategories.map(sub => (
                      <li key={sub.id}>
                        <Link
                          href={`/category/${sub.slug}`}
                          className="block py-2 hover:text-primary"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {links.map(link => (
              <li key={link.id}>
                <Link
                  href={link.url}
                  target="_blank"
                  className="font-medium hover:text-primary transition"
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
