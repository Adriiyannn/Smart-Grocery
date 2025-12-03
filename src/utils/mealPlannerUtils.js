import supabase from './supabase';

// ==================== RECIPE MANAGEMENT ====================

// Get or create a default recipe library for user
export const getOrCreateRecipeLibrary = async (userId) => {
  try {
    // Fetch all recipes available for the user (or system defaults)
    const { data: recipes, error } = await supabase
      .from('Meal')
      .select('*, Meal_Ingredient(*, Product(product_id, product_name, unit_type))')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('meal_name');

    if (error) throw error;
    return recipes || [];
  } catch (error) {
    console.error('Error fetching recipe library:', error);
    throw error;
  }
};

// Add a new recipe
export const addRecipe = async (userId, mealName, ingredients) => {
  try {
    // Create meal
    const { data: meal, error: mealError } = await supabase
      .from('Meal')
      .insert({
        user_id: userId,
        meal_name: mealName,
        meal_date: null, // Recipe doesn't have a date until scheduled
      })
      .select()
      .single();

    if (mealError) throw mealError;

    // Add ingredients to meal
    const ingredientData = ingredients.map(ing => ({
      meal_id: meal.meal_id,
      product_id: ing.product_id,
      quantity_required: ing.quantity_required,
    }));

    const { error: ingredientsError } = await supabase
      .from('Meal_Ingredient')
      .insert(ingredientData);

    if (ingredientsError) throw ingredientsError;

    // Fetch and return the complete recipe
    const { data: completeRecipe, error: fetchError } = await supabase
      .from('Meal')
      .select('*, Meal_Ingredient(*, Product(product_id, product_name, unit_type))')
      .eq('meal_id', meal.meal_id)
      .single();

    if (fetchError) throw fetchError;
    return completeRecipe;
  } catch (error) {
    console.error('Error adding recipe:', error);
    throw error;
  }
};

// ==================== MEAL CALENDAR MANAGEMENT ====================

// Get meals for a specific week
export const getMealsForWeek = async (userId, startDate) => {
  try {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const { data: meals, error } = await supabase
      .from('Meal')
      .select('*, Meal_Ingredient(*, Product(product_id, product_name, unit_type))')
      .eq('user_id', userId)
      .gte('meal_date', startDate.toISOString().split('T')[0])
      .lt('meal_date', endDate.toISOString().split('T')[0])
      .order('meal_date', { ascending: true });

    if (error) throw error;
    return meals || [];
  } catch (error) {
    console.error('Error fetching meals for week:', error);
    throw error;
  }
};

// Get all upcoming meals
export const getUpcomingMeals = async (userId, daysAhead = 30) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data: meals, error } = await supabase
      .from('Meal')
      .select('*, Meal_Ingredient(*, Product(product_id, product_name, unit_type))')
      .eq('user_id', userId)
      .gte('meal_date', today)
      .lte('meal_date', futureDate.toISOString().split('T')[0])
      .order('meal_date', { ascending: true });

    if (error) throw error;
    return meals || [];
  } catch (error) {
    console.error('Error fetching upcoming meals:', error);
    throw error;
  }
};

// Schedule a meal (recipe) for a specific date
export const scheduleMeal = async (userId, mealName, mealDate, ingredients) => {
  try {
    // Create meal with specific date
    const { data: meal, error: mealError } = await supabase
      .from('Meal')
      .insert({
        user_id: userId,
        meal_name: mealName,
        meal_date: mealDate,
      })
      .select()
      .single();

    if (mealError) throw mealError;

    // Add ingredients
    const ingredientData = ingredients.map(ing => ({
      meal_id: meal.meal_id,
      product_id: ing.product_id,
      quantity_required: ing.quantity_required,
    }));

    const { error: ingredientsError } = await supabase
      .from('Meal_Ingredient')
      .insert(ingredientData);

    if (ingredientsError) throw ingredientsError;

    // Fetch and return complete meal
    const { data: completeMeal, error: fetchError } = await supabase
      .from('Meal')
      .select('*, Meal_Ingredient(*, Product(product_id, product_name, unit_type))')
      .eq('meal_id', meal.meal_id)
      .single();

    if (fetchError) throw fetchError;
    return completeMeal;
  } catch (error) {
    console.error('Error scheduling meal:', error);
    throw error;
  }
};

// Update meal date
export const updateMealDate = async (mealId, newDate) => {
  try {
    const { data, error } = await supabase
      .from('Meal')
      .update({ meal_date: newDate })
      .eq('meal_id', mealId)
      .select('*, Meal_Ingredient(*, Product(product_id, product_name, unit_type))')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating meal date:', error);
    throw error;
  }
};

// Delete a meal
export const deleteMeal = async (mealId) => {
  try {
    // Delete meal ingredients first (cascading)
    const { error: ingredientsError } = await supabase
      .from('Meal_Ingredient')
      .delete()
      .eq('meal_id', mealId);

    if (ingredientsError) throw ingredientsError;

    // Delete meal
    const { error: mealError } = await supabase
      .from('Meal')
      .delete()
      .eq('meal_id', mealId);

    if (mealError) throw mealError;
    return true;
  } catch (error) {
    console.error('Error deleting meal:', error);
    throw error;
  }
};

// ==================== AUTO-ADD TO GROCERY LIST ====================

// Add meal ingredients to grocery list
export const addMealIngredientsToGroceryList = async (listId, mealId) => {
  try {
    // Fetch meal ingredients
    const { data: mealIngredients, error: fetchError } = await supabase
      .from('Meal_Ingredient')
      .select('product_id, quantity_required')
      .eq('meal_id', mealId);

    if (fetchError) throw fetchError;

    if (!mealIngredients || mealIngredients.length === 0) {
      return [];
    }

    // Check for existing items and aggregate quantities
    const { data: existingItems, error: checkError } = await supabase
      .from('Grocery_List_Item')
      .select('gl_item_id, product_id, quantity_needed')
      .eq('list_id', listId);

    if (checkError) throw checkError;

    const itemsToInsert = [];
    const itemsToUpdate = [];

    for (const ingredient of mealIngredients) {
      const existing = existingItems?.find(item => item.product_id === ingredient.product_id);

      if (existing) {
        itemsToUpdate.push({
          gl_item_id: existing.gl_item_id,
          quantity_needed: existing.quantity_needed + ingredient.quantity_required,
        });
      } else {
        itemsToInsert.push({
          list_id: listId,
          product_id: ingredient.product_id,
          quantity_needed: ingredient.quantity_required,
          is_checked: false,
        });
      }
    }

    // Insert new items
    if (itemsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('Grocery_List_Item')
        .insert(itemsToInsert);

      if (insertError) throw insertError;
    }

    // Update existing items with new quantities
    if (itemsToUpdate.length > 0) {
      for (const item of itemsToUpdate) {
        const { error: updateError } = await supabase
          .from('Grocery_List_Item')
          .update({ quantity_needed: item.quantity_needed })
          .eq('gl_item_id', item.gl_item_id);

        if (updateError) throw updateError;
      }
    }

    return { inserted: itemsToInsert.length, updated: itemsToUpdate.length };
  } catch (error) {
    console.error('Error adding meal ingredients to grocery list:', error);
    throw error;
  }
};

// ==================== EXPIRING ITEMS SUGGESTIONS ====================

// Get items expiring soon and suggest recipes using them
export const getSuggestionsByExpiringItems = async (userId, daysUntilExpiry = 3) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

    // Get items expiring soon
    const { data: expiringItems, error: expiryError } = await supabase
      .from('Inventory')
      .select('*, Product(product_id, product_name)')
      .eq('user_id', userId)
      .gte('expiration_date', today)
      .lte('expiration_date', expiryDate.toISOString().split('T')[0]);

    if (expiryError) throw expiryError;

    if (!expiringItems || expiringItems.length === 0) {
      return { expiringItems: [], suggestedRecipes: [] };
    }

    // Get all recipes that contain these products
    const productIds = expiringItems.map(item => item.product_id);
    const { data: recipesByProduct, error: recipeError } = await supabase
      .from('Meal_Ingredient')
      .select('meal_id, Meal(meal_id, meal_name)')
      .in('product_id', productIds);

    if (recipeError) throw recipeError;

    // Deduplicate recipes and create suggestions
    const uniqueRecipes = {};
    if (recipesByProduct) {
      recipesByProduct.forEach(recipe => {
        if (recipe.Meal && recipe.Meal.meal_id) {
          if (!uniqueRecipes[recipe.Meal.meal_id]) {
            uniqueRecipes[recipe.Meal.meal_id] = recipe.Meal;
          }
        }
      });
    }

    return {
      expiringItems,
      suggestedRecipes: Object.values(uniqueRecipes),
    };
  } catch (error) {
    console.error('Error getting expiring item suggestions:', error);
    throw error;
  }
};

// ==================== NUTRITIONAL INFO ====================

// Get nutritional info for a meal (mock data - can be replaced with real API)
export const getMealNutritionalInfo = async (mealId) => {
  try {
    // Fetch meal ingredients
    const { data: ingredients, error } = await supabase
      .from('Meal_Ingredient')
      .select('quantity_required, Product(product_name)')
      .eq('meal_id', mealId);

    if (error) throw error;

    // Mock nutritional data - replace with real API if needed
    const nutritionalData = {
      mealId,
      ingredients: ingredients || [],
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };

    // Calculate based on ingredients (simplified mock calculation)
    if (ingredients) {
      ingredients.forEach(ing => {
        // Mock values - would need a real nutrition database
        nutritionalData.calories += ing.quantity_required * 50;
        nutritionalData.protein += ing.quantity_required * 5;
        nutritionalData.carbs += ing.quantity_required * 8;
        nutritionalData.fat += ing.quantity_required * 2;
        nutritionalData.fiber += ing.quantity_required * 1;
      });
    }

    return nutritionalData;
  } catch (error) {
    console.error('Error getting nutritional info:', error);
    throw error;
  }
};

// ==================== UTILITIES ====================

// Get all products (for selecting ingredients)
export const getAllProducts = async () => {
  try {
    const { data: products, error } = await supabase
      .from('Product')
      .select('*')
      .order('product_name');

    if (error) throw error;
    return products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Create or get a product
export const getOrCreateProduct = async (productName, category = '', unitType = 'unit') => {
  try {
    // Check if product exists
    const { data: existing, error: checkError } = await supabase
      .from('Product')
      .select('*')
      .ilike('product_name', productName)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return existing[0];
    }

    // Create new product
    const { data: newProduct, error: createError } = await supabase
      .from('Product')
      .insert({
        product_name: productName,
        category,
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
