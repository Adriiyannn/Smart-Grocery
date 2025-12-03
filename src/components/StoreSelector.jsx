import { useState } from 'react';
import { MapPin, DollarSign, Star, X } from 'lucide-react';

export default function StoreSelector({ isOpen, onClose, onSelectStore, loading }) {
  const [selectedStore, setSelectedStore] = useState(null);

  // Mock store data - in a real app, this would come from an API
  const stores = [
    {
      id: 1,
      name: 'Local Supermarket',
      location: '0.5 km away',
      priceLevel: '$$',
      rating: 4.5,
      specialties: ['Fresh Produce', 'Organic'],
      emoji: '🏪',
    },
    {
      id: 2,
      name: 'Budget Store',
      location: '1.2 km away',
      priceLevel: '$',
      rating: 4.2,
      specialties: ['Low Prices', 'Bulk Items'],
      emoji: '💰',
    },
    {
      id: 3,
      name: 'Premium Market',
      location: '2.1 km away',
      priceLevel: '$$$',
      rating: 4.8,
      specialties: ['Organic', 'International', 'Gourmet'],
      emoji: '✨',
    },
    {
      id: 4,
      name: 'Farmer\'s Market',
      location: '0.8 km away',
      priceLevel: '$$',
      rating: 4.7,
      specialties: ['Fresh Produce', 'Local', 'Seasonal'],
      emoji: '🌾',
    },
  ];

  const handleSelectStore = (store) => {
    setSelectedStore(store);
    onSelectStore(store);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-orange-500 to-red-500 text-white p-7 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">🏬 Select Your Store</h2>
            <p className="text-orange-100 text-sm mt-1">Choose a store to see better price estimates</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Store List */}
        <div className="overflow-y-auto p-5 space-y-3 flex-1">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => handleSelectStore(store)}
              className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 text-left transform hover:scale-105 ${
                selectedStore?.id === store.id
                  ? 'border-indigo-600 bg-linear-to-r from-indigo-50 to-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{store.emoji}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{store.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded-lg">
                          <MapPin className="w-4 h-4" />
                          {store.location}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 bg-yellow-50 px-2 py-1 rounded-lg">
                          <DollarSign className="w-4 h-4" />
                          {store.priceLevel}
                        </div>
                        <div className="flex items-center gap-1 text-sm font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                          <Star className="w-4 h-4 fill-current" />
                          {store.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {store.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="text-xs font-semibold bg-linear-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 ml-4">
                  {selectedStore?.id === store.id && (
                    <div className="w-8 h-8 bg-linear-to-r from-indigo-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition duration-200 transform hover:scale-105"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            disabled={!selectedStore || loading}
            className="flex-1 px-5 py-3 bg-linear-to-r from-orange-500 to-red-500 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-bold transition duration-200 transform hover:scale-105"
          >
            {loading ? '⏳ Loading...' : selectedStore ? '✓ Apply Store' : 'Select a Store'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
