import supabase from './supabase';

// Calculate days until expiration
export const daysUntilExpiration = (expirationDate) => {
  const expDate = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get expiration status color
export const getExpirationStatusColor = (expirationDate) => {
  const days = daysUntilExpiration(expirationDate);
  if (days < 0) return 'expired';
  if (days <= 3) return 'critical';
  if (days <= 7) return 'warning';
  return 'good';
};

// Get expiration status label
export const getExpirationStatusLabel = (expirationDate) => {
  const days = daysUntilExpiration(expirationDate);
  if (days < 0) return `Expired ${Math.abs(days)} days ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 3) return `${days} days left`;
  if (days <= 7) return `${days} days left`;
  return 'Good';
};

// Fetch all inventory items for a user
export const fetchInventoryItems = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('Inventory')
      .select(`
        inventory_id,
        product_id,
        quantity,
        expiration_date,
        last_updated,
        Product(product_id, product_name, category, unit_type)
      `)
      .eq('user_id', userId)
      .order('expiration_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    throw error;
  }
};

// Add item to inventory
export const addInventoryItem = async (userId, productId, quantity, expirationDate) => {
  try {
    const { data, error } = await supabase
      .from('Inventory')
      .insert({
        user_id: userId,
        product_id: productId,
        quantity,
        expiration_date: expirationDate,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
};

// Update inventory quantity
export const updateInventoryQuantity = async (inventoryId, newQuantity) => {
  try {
    const { data, error } = await supabase
      .from('Inventory')
      .update({
        quantity: newQuantity,
        last_updated: new Date().toISOString(),
      })
      .eq('inventory_id', inventoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating inventory quantity:', error);
    throw error;
  }
};

// Delete inventory item
export const deleteInventoryItem = async (inventoryId) => {
  try {
    const { error } = await supabase
      .from('Inventory')
      .delete()
      .eq('inventory_id', inventoryId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
};

// Get items expiring within specified days
export const getExpiringItems = async (userId, days = 7) => {
  try {
    const { data, error } = await supabase
      .from('Inventory')
      .select(`
        inventory_id,
        product_id,
        quantity,
        expiration_date,
        last_updated,
        Product(product_id, product_name, category, unit_type)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const today = new Date();
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + days);

    const expiringItems = (data || [])
      .filter(item => {
        const itemExpDate = new Date(item.expiration_date);
        return itemExpDate > today && itemExpDate <= expiringDate;
      })
      .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));

    return expiringItems;
  } catch (error) {
    console.error('Error getting expiring items:', error);
    throw error;
  }
};

// Get expired items
export const getExpiredItems = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('Inventory')
      .select(`
        inventory_id,
        product_id,
        quantity,
        expiration_date,
        last_updated,
        Product(product_id, product_name, category, unit_type)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredItems = (data || [])
      .filter(item => {
        const itemExpDate = new Date(item.expiration_date);
        itemExpDate.setHours(0, 0, 0, 0);
        return itemExpDate < today;
      })
      .sort((a, b) => new Date(b.expiration_date) - new Date(a.expiration_date));

    return expiredItems;
  } catch (error) {
    console.error('Error getting expired items:', error);
    throw error;
  }
};

// Get recipe suggestions for expiring items
export const getRecipeSuggestionsForExpiringItems = async (userId, limit = 3) => {
  try {
    // Get expiring items (next 7 days)
    const expiringItems = await getExpiringItems(userId, 7);
    
    if (expiringItems.length === 0) {
      return [];
    }

    // Get product IDs from expiring items
    const expiringProductIds = expiringItems.map(item => item.product_id);

    // Find meals that use these products
    const { data: mealIngredients, error: ingredError } = await supabase
      .from('Meal_Ingredient')
      .select(`
        meal_id,
        Meal(meal_id, user_id, meal_name, meal_date)
      `)
      .in('product_id', expiringProductIds);

    if (ingredError) throw ingredError;

    // Filter by user's meals and get unique meals
    const userMeals = (mealIngredients || [])
      .filter(mi => mi.Meal && mi.Meal.user_id === userId)
      .map(mi => mi.Meal)
      .filter((meal, index, arr) => arr.findIndex(m => m.meal_id === meal.meal_id) === index)
      .slice(0, limit);

    return userMeals;
  } catch (error) {
    console.error('Error getting recipe suggestions:', error);
    return [];
  }
};

// Move grocery item to inventory
export const moveGroceryItemToInventory = async (
  userId,
  groceryItemId,
  productId,
  quantity,
  expirationDate
) => {
  try {
    // Add to inventory
    await addInventoryItem(userId, productId, quantity, expirationDate);

    // Mark grocery item as moved (delete it)
    const { error: deleteError } = await supabase
      .from('Grocery_List_Item')
      .delete()
      .eq('gl_item_id', groceryItemId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error moving item to inventory:', error);
    throw error;
  }
};

// Get inventory summary statistics
export const getInventorySummary = async (userId) => {
  try {
    const [items, expiring, expired] = await Promise.all([
      fetchInventoryItems(userId),
      getExpiringItems(userId, 7),
      getExpiredItems(userId),
    ]);

    return {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
      expiringCount: expiring.length,
      expiredCount: expired.length,
      categories: [...new Set(items.map(item => item.Product?.category))].filter(Boolean),
    };
  } catch (error) {
    console.error('Error getting inventory summary:', error);
    throw error;
  }
};

// Search inventory items
export const searchInventoryItems = async (userId, searchTerm) => {
  try {
    const items = await fetchInventoryItems(userId);
    
    return items.filter(item =>
      item.Product?.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Product?.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching inventory:', error);
    throw error;
  }
};

// Filter items by category
export const filterInventoryByCategory = async (userId, category) => {
  try {
    const items = await fetchInventoryItems(userId);
    
    if (category === 'All') return items;
    
    return items.filter(item => item.Product?.category === category);
  } catch (error) {
    console.error('Error filtering inventory:', error);
    throw error;
  }
};

// Get inventory items by status (expiring, expired, good)
export const getInventoryByStatus = async (userId) => {
  try {
    const [items, expiring, expired] = await Promise.all([
      fetchInventoryItems(userId),
      getExpiringItems(userId, 7),
      getExpiredItems(userId),
    ]);

    const expiringIds = new Set(expiring.map(item => item.inventory_id));
    const expiredIds = new Set(expired.map(item => item.inventory_id));

    return {
      good: items.filter(item => !expiringIds.has(item.inventory_id) && !expiredIds.has(item.inventory_id)),
      expiring,
      expired,
    };
  } catch (error) {
    console.error('Error getting inventory by status:', error);
    throw error;
  }
};
