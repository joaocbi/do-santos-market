export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Site em Manutenção
          </h1>
          <p className="text-gray-600 mb-6">
            Estamos trabalhando para melhorar nossa plataforma. Voltaremos em breve!
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-indigo-800">
              <strong>O que está acontecendo?</strong>
            </p>
            <p className="text-sm text-indigo-700 mt-2">
              Estamos realizando atualizações e correções para oferecer uma melhor experiência.
            </p>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Em caso de dúvidas, entre em contato conosco
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
