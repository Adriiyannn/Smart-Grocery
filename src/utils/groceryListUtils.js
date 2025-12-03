import supabase from './supabase';

// Get or create active grocery list for user
export const getOrCreateActiveList = async (userId) => {
  try {
    // Check for existing active list
    const { data: lists, error: listError } = await supabase
      .from('Grocery_List')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1);

    if (listError) throw listError;

    if (lists && lists.length > 0) {
      return lists[0];
    }

    // Return null if no list exists - let the component create it when needed
    return null;
  } catch (error) {
    console.error('Error getting active list:', error);
    throw error;
  }
};

// Create a new active grocery list
export const createActiveList = async (userId) => {
  try {
    const { data: newList, error: createError } = await supabase
      .from('Grocery_List')
      .insert({ user_id: userId, status: 'active' })
      .select()
      .single();

    if (createError) throw createError;
    return newList;
  } catch (error) {
    console.error('Error creating active list:', error);
    throw error;
  }
};

// Fetch grocery list items with product details
export const fetchGroceryListItems = async (listId) => {
  try {
    const { data, error } = await supabase
      .from('Grocery_List_Item')
      .select('gl_item_id, list_id, product_id, quantity_needed, is_checked, Product(product_id, product_name, category, unit_type)')
      .eq('list_id', listId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching grocery list items:', error);
    throw error;
  }
};

// Add item to grocery list
export const addGroceryListItem = async (listId, productId, quantity = 1) => {
  try {
    const { data, error } = await supabase
      .from('Grocery_List_Item')
      .insert({
        list_id: listId,
        product_id: productId,
        quantity_needed: quantity,
        is_checked: false,
      })
      .select('gl_item_id, list_id, product_id, quantity_needed, is_checked')
      .single();

    if (error) throw error;
    
    const { data: product } = await supabase
      .from('Product')
      .select('product_id, product_name, category, unit_type')
      .eq('product_id', productId)
      .single();
    
    return { ...data, Product: product };
  } catch (error) {
    console.error('Error adding item to list:', error);
    throw error;
  }
};

// Toggle item checked status
export const toggleItemChecked = async (itemId, currentStatus) => {
  try {
    const { data, error } = await supabase
      .from('Grocery_List_Item')
      .update({ is_checked: !currentStatus })
      .eq('gl_item_id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error toggling item:', error);
    throw error;
  }
};

// Remove item from grocery list
export const removeGroceryListItem = async (itemId) => {
  try {
    const { error } = await supabase
      .from('Grocery_List_Item')
      .delete()
      .eq('gl_item_id', itemId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing item:', error);
    throw error;
  }
};

// Get frequently purchased products (habits)
export const getUserPurchaseHabits = async (userId, limit = 10) => {
  try {
    // Get completed lists
    const { data: completedLists, error: listsError } = await supabase
      .from('Grocery_List')
      .select('list_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(5);

    if (listsError) throw listsError;

    if (!completedLists || completedLists.length === 0) {
      return [];
    }

    const listIds = completedLists.map(l => l.list_id);

    // Get items from those lists
    const { data: items, error: itemsError } = await supabase
      .from('Grocery_List_Item')
      .select('product_id, Product(product_id, product_name, category)')
      .in('list_id', listIds);

    if (itemsError) throw itemsError;

    // Count occurrences and sort by frequency
    const habitMap = {};
    items?.forEach(item => {
      if (item.product_id) {
        habitMap[item.product_id] = (habitMap[item.product_id] || 0) + 1;
      }
    });

    const habits = Object.entries(habitMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId]) => productId);

    return habits;
  } catch (error) {
    console.error('Error fetching purchase habits:', error);
    throw error;
  }
};

// Get ingredients from upcoming meals
export const getUpcomingMealIngredients = async (userId, days = 7) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    // Get upcoming meals
    const { data: meals, error: mealsError } = await supabase
      .from('Meal')
      .select('meal_id')
      .eq('user_id', userId)
      .gte('meal_date', today)
      .lte('meal_date', futureDateStr);

    if (mealsError) throw mealsError;

    if (!meals || meals.length === 0) {
      return [];
    }

    const mealIds = meals.map(m => m.meal_id);

    // Get ingredients
    const { data: ingredients, error: ingError } = await supabase
      .from('Meal_Ingredient')
      .select('meal_ing_id, meal_id, product_id, quantity_required')
      .in('meal_id', mealIds);

    if (ingError) throw ingError;
    return ingredients || [];
  } catch (error) {
    console.error('Error fetching meal ingredients:', error);
    throw error;
  }
};

// Complete a grocery list
export const completeGroceryList = async (listId) => {
  try {
    const { error } = await supabase
      .from('Grocery_List')
      .update({ status: 'completed' })
      .eq('list_id', listId);

    if (error) throw error;
  } catch (error) {
    console.error('Error completing list:', error);
    throw error;
  }
};

// Export list as CSV
export const exportListAsCSV = (items, filename = 'grocery-list.csv') => {
  try {
    let csv = 'Category,Item,Quantity,Unit,Purchased\n';

    items.forEach(item => {
      const category = item.Product?.category || 'Other';
      const name = item.Product?.product_name || 'Unknown';
      const quantity = item.quantity_needed || 1;
      const unit = item.Product?.unit_type || 'qty';
      const purchased = item.is_checked ? 'Yes' : 'No';

      csv += `"${category}","${name}",${quantity},"${unit}","${purchased}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error exporting list:', error);
    throw error;
  }
};

// Create or get product by name
export const getOrCreateProduct = async (productName, category = 'Other', unitType = 'qty') => {
  try {
    // Check if product exists
    const { data: existing, error: searchError } = await supabase
      .from('Product')
      .select('*')
      .ilike('product_name', productName)
      .limit(1);

    if (searchError) throw searchError;

    if (existing && existing.length > 0) {
      return existing[0];
    }

    // Create new product
    const { data: newProduct, error: createError } = await supabase
      .from('Product')
      .insert({
        product_name: productName,
        category: category,
        unit_type: unitType,
      })
      .select()
      .single();

    if (createError) throw createError;
    return newProduct;
  } catch (error) {
    console.error('Error getting or creating product:', error);
    throw error;
  }
};

// Bulk add items to list
export const bulkAddItemsToList = async (listId, items) => {
  try {
    const { data, error } = await supabase
      .from('Grocery_List_Item')
      .insert(items)
      .select('gl_item_id, list_id, product_id, quantity_needed, is_checked');

    if (error) throw error;
    
    // Fetch product details for each item
    if (data && data.length > 0) {
      const productIds = data.map(item => item.product_id);
      const { data: products } = await supabase
        .from('Product')
        .select('product_id, product_name, category, unit_type')
        .in('product_id', productIds);
      
      const productMap = {};
      products?.forEach(p => {
        productMap[p.product_id] = p;
      });
      
      return data.map(item => ({
        ...item,
        Product: productMap[item.product_id]
      }));
    }
    
    return data || [];
  } catch (error) {
    console.error('Error bulk adding items:', error);
    throw error;
  }
};

// Get all products
export const getAllProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('Product')
      .select('*')
      .order('product_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Search products by name
export const searchProducts = async (query) => {
  try {
    const { data, error } = await supabase
      .from('Product')
      .select('*')
      .ilike('product_name', `%${query}%`)
      .order('product_name', { ascending: true })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};
