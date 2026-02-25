'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Banner } from '@/lib/types';
import { normalizeImageUrl } from '@/lib/imageUtils';

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/banners?position=home')
      .then(res => {
        if (!res.ok) {
          console.error('Failed to fetch banners:', res.status, res.statusText);
          return [];
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setBanners(data);
        } else if (data?.error) {
          console.error('Banner API error:', data.error);
          setBanners([]);
        } else {
          console.error('Invalid banner data format:', data);
          setBanners([]);
        }
      })
      .catch(error => {
        console.error('Error fetching banners:', error);
        setBanners([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (isLoading) {
    return (
      <div className="w-full h-[400px] md:h-[500px] bg-gray-100 animate-pulse flex items-center justify-center">
        <p className="text-gray-400">Carregando banner...</p>
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden bg-white">
      <div className="w-full relative">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`${
              index === currentIndex ? 'relative' : 'absolute inset-0'
            } transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {banner.link ? (
              <Link href={banner.link}>
                <img
                  src={normalizeImageUrl(banner.image)}
                  alt={banner.title}
                  className="w-full h-auto block"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              </Link>
            ) : (
              <img
                src={normalizeImageUrl(banner.image)}
                alt={banner.title}
                className="w-full h-auto block"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        ))}
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
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
