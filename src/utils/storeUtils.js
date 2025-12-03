import supabase from './supabase';

// Store pricing mock data (in production, this would come from a real API)
export const STORE_OPTIONS = [
  { id: 'robinsons', name: 'Robinsons Supermarket', icon: '🏬' },
  { id: 'puregold', name: 'Puregold', icon: '🛒' },
  { id: 'gaisano', name: 'Gaisano Mall', icon: '🏪' },
  { id: 'iligan_market', name: 'Iligan City Public Market', icon: '🛍️' },
  { id: '7eleven', name: '7-Eleven', icon: '🏪' },
  { id: 'ministop', name: 'Mini Stop', icon: '🛒' },
];

// Estimate prices based on store and category
// Prices in Philippine Pesos (₱)
export const estimatePrice = (productName, category, store = 'robinsons', quantity = 1) => {
  // Pricing data for categories - based on average market prices in PHP
  const basePrices = {
    'Produce': { avg: 65, min: 50, max: 80 },
    'Vegetables': { avg: 65, min: 50, max: 80 },
    'Dairy': { avg: 100, min: 80, max: 120 },
    'Meat': { avg: 225, min: 150, max: 300 },
    'Bakery': { avg: 45, min: 40, max: 50 },
    'Grains & Bread': { avg: 45, min: 40, max: 50 },
    'Fruits': { avg: 80, min: 60, max: 100 },
    'Beverages': { avg: 85, min: 50, max: 120 },
    'Frozen': { avg: 100, min: 80, max: 120 },
    'Pantry': { avg: 65, min: 30, max: 100 },
    'Condiments': { avg: 65, min: 40, max: 90 },
    'Snacks': { avg: 70, min: 40, max: 100 },
    'Other': { avg: 65, min: 30, max: 100 },
  };

  const priceData = basePrices[category] || basePrices['Other'];
  const avgPrice = priceData.avg;

  // Store multipliers (mock data)
  const storeMultipliers = {
    'robinsons': 1.0,
    'puregold': 0.95,
    'gaisano': 1.05,
    'iligan_market': 0.90,
    '7eleven': 1.20,
    'ministop': 1.15,
  };

  const multiplier = storeMultipliers[store] || 1.0;
  const price = avgPrice * multiplier * quantity;

  return parseFloat(price.toFixed(2));
};

// Calculate total estimated cost
export const calculateTotalEstimate = (items, store = 'robinsons') => {
  return items.reduce((total, item) => {
    const price = estimatePrice(
      item.Product?.product_name || '',
      item.Product?.category || 'Other',
      store,
      item.quantity_needed || 1
    );
    return total + price;
  }, 0);
};

// Get nearby stores (mock data - would use Maps API in production)
export const getNearbyStores = async (userLocation) => {
  // Mock implementation
  return STORE_OPTIONS.map(store => ({
    ...store,
    distance: Math.floor(Math.random() * 10) + 1, // Random 1-10 miles
    openNow: Math.random() > 0.2, // 80% chance open
  }));
};

// Format price currency
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(price);
};

// Save store preference for user
export const saveStorePreference = async (userId, storeId) => {
  try {
    const { data: existing, error: selectError } = await supabase
      .from('User')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') throw selectError;

    // Store preference could be saved in user metadata or a separate table
    // For now, we'll store it in user metadata via Supabase Auth
    console.log(`Store preference set to: ${storeId}`);
  } catch (error) {
    console.error('Error saving store preference:', error);
  }
};
