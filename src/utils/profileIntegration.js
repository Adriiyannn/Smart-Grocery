import { 
  getUserDietaryPreferences, 
  getShoppingHabits, 
  getUserSettings,
  getPurchaseHistory 
} from './userProfileUtils';

/**
 * Integration Helper - Use this to incorporate user preferences throughout the app
 */

// ==================== MEAL PLANNER INTEGRATION ====================

/**
 * Get filtered recipes based on user's dietary restrictions
 */
export const getFilteredRecipes = async (userId, allRecipes) => {
  const dietary = await getUserDietaryPreferences(userId);
  
  if (!dietary) return allRecipes;

  return allRecipes.filter(recipe => {
    // Filter out recipes with allergens
    if (dietary.allergies && dietary.allergies.length > 0) {
      const hasAllergen = dietary.allergies.some(allergen => 
        recipe.ingredients?.some(ing => 
          ing.toLowerCase().includes(allergen.toLowerCase())
        )
      );
      if (hasAllergen) return false;
    }

    // Filter by diet type
    if (dietary.diet_type && !recipe.diet_types?.includes(dietary.diet_type)) {
      return false;
    }

    return true;
  });
};

// ==================== GROCERY LIST INTEGRATION ====================

/**
 * Apply user's preferred stores to grocery list prices
 */
export const applyStorePreferences = async (userId, groceryItems) => {
  const habits = await getShoppingHabits(userId);
  
  if (!habits) return groceryItems;

  return groceryItems.map(item => ({
    ...item,
    preferredStores: item.stores?.filter(store => 
      habits.preferred_stores?.includes(store)
    )
  }));
};

/**
 * Check if grocery list total is within budget
 */
export const checkBudget = async (userId, totalPrice) => {
  const habits = await getShoppingHabits(userId);
  
  if (!habits?.budget_limit || habits.budget_limit === 0) {
    return { withinBudget: true, remaining: null };
  }

  const withinBudget = totalPrice <= habits.budget_limit;
  const remaining = habits.budget_limit - totalPrice;

  return { withinBudget, remaining, limit: habits.budget_limit };
};

// ==================== INVENTORY MANAGEMENT INTEGRATION ====================

/**
 * Get notification preferences for inventory alerts
 */
export const getNotificationPreferences = async (userId) => {
  const habits = await getShoppingHabits(userId);
  
  if (!habits) return {
    emailNotifications: false,
    pushNotifications: false,
    notifyAbout: []
  };

  return {
    emailNotifications: habits.email_notifications || false,
    pushNotifications: habits.push_notifications || false,
    notifyAbout: habits.notifications_for || [],
    shouldNotifyLowStock: habits.notifications_for?.includes('Low Stock Alerts'),
    shouldNotifyExpiring: habits.notifications_for?.includes('Expiring Items'),
    shouldNotifyPriceDrops: habits.notifications_for?.includes('Price Drop Alerts')
  };
};

// ==================== SETTINGS INTEGRATION ====================

/**
 * Get user's unit system for display formatting
 */
export const getUnitSystem = async (userId) => {
  const settings = await getUserSettings(userId);
  
  if (!settings) return 'imperial';
  
  return settings.unit_system || 'imperial';
};

/**
 * Format measurement based on user's unit preference
 */
export const formatMeasurement = (value, unit, unitSystem) => {
  // unit: 'weight', 'volume', 'temperature'
  // unitSystem: 'imperial' or 'metric'
  
  if (unitSystem === 'metric') {
    if (unit === 'weight') {
      // Convert lbs to kg
      return `${(value * 0.453592).toFixed(2)} kg`;
    } else if (unit === 'volume') {
      // Convert cups to ml
      return `${(value * 236.588).toFixed(0)} ml`;
    } else if (unit === 'temperature') {
      // Convert Fahrenheit to Celsius
      return `${((value - 32) * 5/9).toFixed(0)}°C`;
    }
  }
  
  return value;
};

/**
 * Format date based on user's preference
 */
export const formatDateByPreference = (date, dateFormat) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  switch(dateFormat) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
    default:
      return `${month}/${day}/${year}`;
  }
};

/**
 * Format time based on user's preference
 */
export const formatTimeByPreference = (date, timeFormat) => {
  const d = new Date(date);
  
  if (timeFormat === '24h') {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// ==================== ANALYTICS INTEGRATION ====================

/**
 * Get user's typical spending pattern
 */
export const getSpendingPattern = async (userId) => {
  const history = await getPurchaseHistory(userId, 100);
  
  const categories = {};
  history.forEach(purchase => {
    const cat = purchase.category || 'Other';
    categories[cat] = (categories[cat] || 0) + (purchase.amount || 0);
  });

  return categories;
};

/**
 * Get recommended budget based on purchase history
 */
export const getRecommendedBudget = async (userId) => {
  const history = await getPurchaseHistory(userId, 52); // Last year
  
  if (history.length === 0) return null;

  const totalSpent = history.reduce((sum, p) => sum + (p.amount || 0), 0);
  const averagePerWeek = totalSpent / Math.ceil(history.length / 4);
  
  return {
    recommendedWeekly: Math.round(averagePerWeek * 100) / 100,
    averagePerPurchase: totalSpent / history.length,
    totalHistoryAmount: totalSpent
  };
};

// ==================== PREFERENCES SUMMARY ====================

/**
 * Get all user preferences at once (for dashboard overview)
 */
export const getAllUserPreferences = async (userId) => {
  const [dietary, habits, settings] = await Promise.all([
    getUserDietaryPreferences(userId),
    getShoppingHabits(userId),
    getUserSettings(userId)
  ]);

  return {
    dietary: dietary || {},
    habits: habits || {},
    settings: settings || {}
  };
};
