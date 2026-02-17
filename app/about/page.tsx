'use client';

import Header from '@/components/Header';
import WhatsAppButton from '@/components/WhatsAppButton';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Sobre Nós</h1>
          
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Bem-vindo ao Do Santos Market</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              O Do Santos Market é uma plataforma de e-commerce dedicada a oferecer produtos de qualidade 
              com excelência no atendimento. Nossa missão é proporcionar uma experiência de compra única, 
              conectando você aos melhores produtos com praticidade e segurança.
            </p>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Trabalhamos com dedicação para garantir que cada cliente tenha acesso a produtos selecionados 
              e um atendimento personalizado. Nossa equipe está sempre pronta para ajudar e garantir sua 
              satisfação.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-3">Nossa Missão</h3>
              <p className="text-gray-700 leading-relaxed">
                Oferecer produtos de qualidade com excelência no atendimento, proporcionando uma experiência 
                de compra única e satisfatória para todos os nossos clientes.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-3">Nossos Valores</h3>
              <p className="text-gray-700 leading-relaxed">
                Comprometimento com a qualidade, transparência nas relações, respeito ao cliente e 
                inovação constante em nossos processos e serviços.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-4">Por que escolher o Do Santos Market?</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Produtos selecionados com garantia de qualidade</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Atendimento personalizado e dedicado</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Processo de compra simples e seguro</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Entrega rápida e confiável</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Suporte ao cliente sempre disponível</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <WhatsAppButton />
      <Footer />
    </div>
  );
}
