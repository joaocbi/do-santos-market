'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Banner } from '@/lib/types';
import { normalizeImageUrl } from '@/lib/imageUtils';

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('/api/banners?position=home')
      .then(res => res.json())
      .then(data => setBanners(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {banner.link ? (
            <Link href={banner.link}>
              <img
                src={normalizeImageUrl(banner.image)}
                alt={banner.title}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            </Link>
          ) : (
            <img
              src={normalizeImageUrl(banner.image)}
              alt={banner.title}
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      ))}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
