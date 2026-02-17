'use client';

import { useState } from 'react';
import { FiPackage, FiUsers, FiCreditCard, FiTruck, FiImage, FiLink, FiVideo, FiSettings, FiLayers } from 'react-icons/fi';
import CategoryModal from './modals/CategoryModal';
import ProductModal from './modals/ProductModal';
import CustomerModal from './modals/CustomerModal';
import PaymentMethodModal from './modals/PaymentMethodModal';
import DeliveryMethodModal from './modals/DeliveryMethodModal';
import BannerModal from './modals/BannerModal';
import LinkModal from './modals/LinkModal';
import GalleryModal from './modals/GalleryModal';
import VideoModal from './modals/VideoModal';
import ConfigModal from './modals/ConfigModal';

export default function AdminDashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const menuItems = [
    { id: 'categories', label: 'Categorias', icon: FiLayers },
    { id: 'products', label: 'Produtos', icon: FiPackage },
    { id: 'customers', label: 'Clientes', icon: FiUsers },
    { id: 'payments', label: 'Formas de Pagamento', icon: FiCreditCard },
    { id: 'deliveries', label: 'Formas de Entrega', icon: FiTruck },
    { id: 'banners', label: 'Banners', icon: FiImage },
    { id: 'links', label: 'Links', icon: FiLink },
    { id: 'gallery', label: 'Galeria', icon: FiImage },
    { id: 'videos', label: 'Vídeos', icon: FiVideo },
    { id: 'config', label: 'Configurações', icon: FiSettings },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModal(item.id)}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition flex flex-col items-center gap-3"
              >
                <Icon size={32} className="text-primary" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeModal === 'categories' && (
        <CategoryModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'products' && (
        <ProductModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'customers' && (
        <CustomerModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'payments' && (
        <PaymentMethodModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'deliveries' && (
        <DeliveryMethodModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'banners' && (
        <BannerModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'links' && (
        <LinkModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'gallery' && (
        <GalleryModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'videos' && (
        <VideoModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'config' && (
        <ConfigModal onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
