import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import supabase from '../utils/supabase';
import Swal from 'sweetalert2';

const modalStyles = `
  input[type="text"],
  input[type="date"],
  input[type="number"],
  select {
    color: #000000 !important;
    background-color: #ffffff !important;
  }
  
  input[type="text"]::placeholder,
  input[type="date"]::placeholder,
  input[type="number"]::placeholder {
    color: #6b7280 !important;
  }
  
  select option {
    color: #000000 !important;
    background-color: #ffffff !important;
  }
  
  input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    background-color: #ffffff !important;
    cursor: pointer;
  }
  
  input[type="checkbox"]:checked {
    background-color: #10b981 !important;
    border-color: #10b981 !important;
    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 20 20' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' fill='white'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100% 100%;
  }
`;

export default function Dashboard({ onAlertsUpdate }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [upcomingMeals, setUpcomingMeals] = useState([]);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [insights, setInsights] = useState({ wasteReduction: 0, moneySaved: 0, totalItems: 0 });
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    unitType: '',
    quantity: '',
    expirationDate: '',
  });
  const [mealData, setMealData] = useState({
    mealName: '',
    mealDate: '',
    ingredients: [],
  });
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingMeal, setEditingMeal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get the current session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        await fetchDashboardData(session.user.id);
        await fetchProducts();
      }
      setLoading(false);
    };

    getSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          fetchDashboardData(session.user.id);
          fetchProducts();
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async (userId) => {
    try {
      // Fetch inventory with product names
      const { data: inventory, error: inventoryError } = await supabase
        .from('Inventory')
        .select('*, Product(product_id, product_name, category)')
        .eq('user_id', userId);

      if (inventoryError) throw inventoryError;

      // Filter out any null or undefined entries
      const validInventory = inventory?.filter(item => item && item.inventory_id) || [];

      // Fetch meals
      const { data: meals, error: mealsError } = await supabase
        .from('Meal')
        .select('*, Meal_Ingredient(*, Product(product_name))')
        .eq('user_id', userId)
        .gte('meal_date', new Date().toISOString().split('T')[0])
        .order('meal_date', { ascending: true });

      if (mealsError) throw mealsError;

      // Fetch active grocery lists
      const { data: groceryLists, error: groceryError } = await supabase
        .from('Grocery_List')
        .select('*, Grocery_List_Item(*, Product(product_name))')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (groceryError) throw groceryError;

      // Process data
      processInventoryData(validInventory);
      processAlerts(validInventory, meals);
      processInsights(validInventory);
      setUpcomingMeals(meals || []);
      processSuggestedItems(meals, validInventory);
      
      // Update products list to only show items in current inventory
      updateProductsFromInventory(validInventory);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const updateProductsFromInventory = (inventory) => {
    if (!inventory || inventory.length === 0) {
      setProducts([]);
      return;
    }
    
    // Extract unique products from inventory
    const uniqueProducts = [];
    const productIds = new Set();
    
    inventory.forEach((item) => {
      if (item.Product && !productIds.has(item.Product.product_id)) {
        productIds.add(item.Product.product_id);
        uniqueProducts.push(item.Product);
      }
    });
    
    setProducts(uniqueProducts);
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('Product')
        .select('*');
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const processInventoryData = (inventory) => {
    if (!inventory) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    const expiringIn30Days = inventory
      .filter((item) => {
        const expDate = new Date(item.expiration_date);
        expDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        const daysUntilExpiry = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
      })
      .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));

    setExpiringItems(expiringIn30Days);
  };

  const processAlerts = (inventory, meals) => {
    const alertsList = [];

    if (!inventory) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    // 1. Low stock items - items with quantity < 2
    const lowStockItems = inventory.filter((item) => item.quantity < 2);
    if (lowStockItems.length > 0) {
      alertsList.push({
        type: 'low-stock',
        message: `${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''} running low on stock`,
        color: 'yellow',
        count: lowStockItems.length,
        details: lowStockItems.map(item => item.Product?.product_name || 'Unknown').join(', '),
        viewed: false,
      });
    }

    // 2. Items expiring within a week (7 days)
    const expiringWeek = inventory.filter((item) => {
      const expDate = new Date(item.expiration_date);
      expDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      const daysUntilExpiry = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
    });

    if (expiringWeek.length > 0) {
      alertsList.push({
        type: 'expiring-soon',
        message: `${expiringWeek.length} item${expiringWeek.length > 1 ? 's' : ''} expiring within a week`,
        color: 'orange',
        count: expiringWeek.length,
        details: expiringWeek.map(item => `${item.Product?.product_name || 'Unknown'} (${new Date(item.expiration_date).toLocaleDateString()})`).join(', '),
        viewed: false,
      });
    }

    // 3. Already expired items
    const expiredItems = inventory.filter((item) => {
      const expDate = new Date(item.expiration_date);
      expDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      return expDate < today;
    });

    if (expiredItems.length > 0) {
      alertsList.push({
        type: 'expired',
        message: `${expiredItems.length} item${expiredItems.length > 1 ? 's' : ''} have expired`,
        color: 'red',
        count: expiredItems.length,
        details: expiredItems.map(item => item.Product?.product_name || 'Unknown').join(', '),
        viewed: false,
      });
    }

    setAlerts(alertsList);
    // Update parent component with alerts
    if (onAlertsUpdate) {
      onAlertsUpdate(alertsList);
    }
  };

  const processSuggestedItems = (meals, inventory) => {
    // Suggest items based on upcoming meals
    if (!meals || meals.length === 0) {
      setSuggestedItems([]);
      return;
    }

    const suggestedMap = new Map();
    const inventoryProducts = new Set(inventory?.map((i) => i.product_id) || []);

    meals.slice(0, 3).forEach((meal) => {
      meal.Meal_Ingredient?.forEach((ingredient) => {
        if (!inventoryProducts.has(ingredient.product_id)) {
          if (!suggestedMap.has(ingredient.product_id)) {
            suggestedMap.set(ingredient.product_id, {
              product_id: ingredient.product_id,
              quantity_needed: 0,
              meals: [],
            });
          }
          const suggested = suggestedMap.get(ingredient.product_id);
          suggested.quantity_needed += ingredient.quantity_required;
          suggested.meals.push(meal.meal_name);
        }
      });
    });

    setSuggestedItems(Array.from(suggestedMap.values()).slice(0, 5));
  };

  const processInsights = (inventory) => {
    // Log what we're receiving
    console.log('processInsights received inventory:', inventory);
    
    // If no inventory or empty array, show all zeros
    if (!inventory || !Array.isArray(inventory) || inventory.length === 0) {
      console.log('Setting insights to zero - no inventory');
      setInsights({ wasteReduction: 0, moneySaved: 0, totalItems: 0 });
      return;
    }

    // Calculate waste reduction (items not expired)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    const notExpiredItems = inventory.filter((item) => {
      if (!item.expiration_date) return false;
      const expDate = new Date(item.expiration_date);
      expDate.setHours(0, 0, 0, 0);
      return expDate > today;
    });

    const notExpiredCount = notExpiredItems.length;
    console.log('Not expired items count:', notExpiredCount, 'Total items:', inventory.length);

    // Only show money saved if there are non-expired items
    const wasteReductionPercent = inventory.length > 0 ? ((notExpiredCount / inventory.length) * 100).toFixed(1) : 0;

    // Estimate money saved based on Philippine ingredient prices by category
    // Using average prices for each category
    const categoryPrices = {
      'Vegetables': 65,        // ₱50-80 average = ₱65
      'Fruits': 80,            // ₱60-100 average = ₱80
      'Dairy': 100,            // ₱80-120 average = ₱100
      'Meat & Fish': 225,      // ₱150-300 average = ₱225
      'Grains & Bread': 45,    // ₱40-50 average = ₱45
      'Pantry': 65,            // ₱30-100 average = ₱65
      'Beverages': 85,         // ₱50-120 average = ₱85
      'Frozen': 100,           // Similar to Dairy
      'Condiments': 65,        // Similar to Pantry
      'Snacks': 70,            // Between Pantry and Beverages
    };

    // Calculate total money saved based on category prices
    let totalMoneySaved = 0;
    notExpiredItems.forEach((item) => {
      const category = item.Product?.category || 'Pantry';
      const price = categoryPrices[category] || 65; // Default to ₱65 if category not found
      totalMoneySaved += price;
    });

    const moneySaved = notExpiredCount > 0 ? totalMoneySaved.toFixed(2) : 0;

    console.log('Final insights:', { 
      inventoryLength: inventory.length, 
      notExpiredCount, 
      moneySaved, 
      wasteReductionPercent 
    });

    setInsights({
      wasteReduction: wasteReductionPercent,
      moneySaved,
      totalItems: inventory.length,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleAddItem = async () => {
    if (!formData.productName || !formData.quantity || !formData.expirationDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in all required fields (Product name, Quantity, Expiration date)',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'center',
        allowOutsideClick: false,
      });
      return;
    }

    setLoadingAction(true);
    try {
      if (editingItem) {
        // Update existing item
        const { error: updateError } = await supabase
          .from('Inventory')
          .update({
            quantity: parseFloat(formData.quantity),
            expiration_date: formData.expirationDate,
            last_updated: new Date().toISOString(),
          })
          .eq('inventory_id', editingItem.inventory_id);

        if (updateError) throw updateError;

        setFormData({
          productName: '',
          category: '',
          unitType: '',
          quantity: '',
          expirationDate: '',
        });
        setEditingItem(null);
        setShowAddItemModal(false);

        Swal.fire({
          icon: 'success',
          title: 'Item Updated!',
          text: `${formData.productName} has been updated.`,
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          position: 'center',
          allowOutsideClick: false,
        });
      } else {
        // Create new item
        let productId;
        const { data: existingProduct } = await supabase
          .from('Product')
          .select('product_id')
          .eq('product_name', formData.productName)
          .single();

        if (existingProduct) {
          productId = existingProduct.product_id;
        } else {
          const { data: newProduct, error: productError } = await supabase
            .from('Product')
            .insert([
              {
                product_name: formData.productName,
                category: formData.category || 'Other',
                unit_type: formData.unitType || 'unit',
              },
            ])
            .select()
            .single();

          if (productError) throw productError;
          productId = newProduct.product_id;
        }

        // Add to inventory
        const { error: inventoryError } = await supabase
          .from('Inventory')
          .insert([
            {
              user_id: user.id,
              product_id: productId,
              quantity: parseFloat(formData.quantity),
              expiration_date: formData.expirationDate,
            },
          ]);

        if (inventoryError) throw inventoryError;

        setFormData({
          productName: '',
          category: '',
          unitType: '',
          quantity: '',
          expirationDate: '',
        });
        setShowAddItemModal(false);

        Swal.fire({
          icon: 'success',
          title: 'Item Added!',
          text: `${formData.productName} has been added to your inventory.`,
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          position: 'center',
          allowOutsideClick: false,
        });
      }
      await fetchDashboardData(user.id);
    } catch (error) {
      console.error('Error saving item:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error saving item: ' + error.message,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'center',
        allowOutsideClick: false,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAddMeal = async () => {
    if (!mealData.mealName || !mealData.mealDate || selectedIngredients.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill in meal name, date, and select at least one ingredient',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'center',
        allowOutsideClick: false,
      });
      return;
    }

    setLoadingAction(true);
    try {
      if (editingMeal) {
        // Update existing meal
        const { error: mealError } = await supabase
          .from('Meal')
          .update({
            meal_name: mealData.mealName,
            meal_date: mealData.mealDate,
          })
          .eq('meal_id', editingMeal.meal_id);

        if (mealError) throw mealError;

        // Delete old ingredients
        const { error: deleteError } = await supabase
          .from('Meal_Ingredient')
          .delete()
          .eq('meal_id', editingMeal.meal_id);

        if (deleteError) throw deleteError;

        // Add new ingredients
        const ingredients = selectedIngredients.map((ing) => ({
          meal_id: editingMeal.meal_id,
          product_id: ing.product_id,
          quantity_required: ing.quantity || 1,
        }));

        const { error: ingredientError } = await supabase
          .from('Meal_Ingredient')
          .insert(ingredients);

        if (ingredientError) throw ingredientError;

        setMealData({
          mealName: '',
          mealDate: '',
          ingredients: [],
        });
        setSelectedIngredients([]);
        setEditingMeal(null);
        setShowAddMealModal(false);

        Swal.fire({
          icon: 'success',
          title: 'Meal Updated!',
          text: `${mealData.mealName} has been updated with ${selectedIngredients.length} ingredients.`,
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          position: 'center',
          allowOutsideClick: false,
        });
      } else {
        // Create new meal
        const { data: newMeal, error: mealError } = await supabase
          .from('Meal')
          .insert([
            {
              user_id: user.id,
              meal_name: mealData.mealName,
              meal_date: mealData.mealDate,
            },
          ])
          .select()
          .single();

        if (mealError) throw mealError;

        // Add ingredients to meal
        const ingredients = selectedIngredients.map((ing) => ({
          meal_id: newMeal.meal_id,
          product_id: ing.product_id,
          quantity_required: ing.quantity || 1,
        }));

        const { error: ingredientError } = await supabase
          .from('Meal_Ingredient')
          .insert(ingredients);

        if (ingredientError) throw ingredientError;

        setMealData({
          mealName: '',
          mealDate: '',
          ingredients: [],
        });
        setSelectedIngredients([]);
        setShowAddMealModal(false);

        Swal.fire({
          icon: 'success',
          title: 'Meal Added!',
          text: `${mealData.mealName} has been added with ${selectedIngredients.length} ingredients.`,
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          position: 'center',
          allowOutsideClick: false,
        });
      }
      await fetchDashboardData(user.id);
    } catch (error) {
      console.error('Error saving meal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error saving meal: ' + error.message,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'center',
        allowOutsideClick: false,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleGenerateGroceryList = async () => {
    setLoadingAction(true);
    try {
      // Get upcoming meals
      const { data: meals, error: mealsError } = await supabase
        .from('Meal')
        .select('*, Meal_Ingredient(*)')
        .eq('user_id', user.id)
        .gte('meal_date', new Date().toISOString().split('T')[0])
        .order('meal_date', { ascending: true })
        .limit(7);

      if (mealsError) throw mealsError;

      // Check if there are any meals
      if (!meals || meals.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'No Meals Added',
          text: 'Please add meals first before generating a grocery list.',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          position: 'center',
          allowOutsideClick: false,
        });
        setLoadingAction(false);
        return;
      }

      // Get current inventory
      const { data: inventory, error: inventoryError } = await supabase
        .from('Inventory')
        .select('product_id, quantity')
        .eq('user_id', user.id);

      if (inventoryError) throw inventoryError;

      const inventoryMap = {};
      inventory?.forEach((item) => {
        inventoryMap[item.product_id] = item.quantity;
      });

      // Calculate needed items
      const neededItems = {};
      meals?.forEach((meal) => {
        meal.Meal_Ingredient?.forEach((ingredient) => {
          if (!neededItems[ingredient.product_id]) {
            neededItems[ingredient.product_id] = 0;
          }
          neededItems[ingredient.product_id] += ingredient.quantity_required;
        });
      });

      // Create grocery list
      const { data: groceryList, error: listError } = await supabase
        .from('Grocery_List')
        .insert([
          {
            user_id: user.id,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (listError) throw listError;

      // Add items to list
      const listItems = Object.entries(neededItems)
        .filter(([productId]) => {
          const currentQty = inventoryMap[productId] || 0;
          return currentQty < neededItems[productId];
        })
        .map(([productId, neededQty]) => ({
          list_id: groceryList.list_id,
          product_id: productId,
          quantity_needed: neededQty - (inventoryMap[productId] || 0),
          is_checked: false,
        }));

      if (listItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('Grocery_List_Item')
          .insert(listItems);

        if (itemsError) throw itemsError;
      }

      Swal.fire({
        icon: 'success',
        title: 'Grocery List Created!',
        text: `Grocery list created with ${listItems.length} items!`,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'center',
        allowOutsideClick: false,
      });
      await fetchDashboardData(user.id);
    } catch (error) {
      console.error('Error generating grocery list:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error generating list: ' + error.message,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'center',
        allowOutsideClick: false,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const getDaysUntilExpiry = (expirationDate) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiry = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry;
  };

  const handleRefreshData = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      await fetchDashboardData(user.id);
      Swal.fire({
        icon: 'success',
        title: 'Refreshed!',
        text: 'Dashboard data has been updated.',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
        position: 'center',
        allowOutsideClick: false,
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to refresh data',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteInventoryItem = async (inventoryId) => {
    const confirm = await Swal.fire({
      title: 'Delete Item?',
      text: 'Are you sure you want to delete this item from inventory?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      position: 'center',
      allowOutsideClick: false,
    });

    if (confirm.isConfirmed) {
      try {
        const { error } = await supabase
          .from('Inventory')
          .delete()
          .eq('inventory_id', inventoryId);

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Item has been removed from inventory.',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          position: 'center',
          allowOutsideClick: false,
        });
        await fetchDashboardData(user.id);
      } catch (error) {
        console.error('Error deleting item:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error deleting item: ' + error.message,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          position: 'center',
          allowOutsideClick: false,
        });
      }
    }
  };

  const handleDeleteMeal = async (mealId) => {
    const confirm = await Swal.fire({
      title: 'Delete Meal?',
      text: 'Are you sure you want to delete this meal?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      position: 'center',
      allowOutsideClick: false,
    });

    if (confirm.isConfirmed) {
      try {
        const { error } = await supabase
          .from('Meal')
          .delete()
          .eq('meal_id', mealId);

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Meal has been removed.',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          position: 'center',
          allowOutsideClick: false,
        });
        await fetchDashboardData(user.id);
      } catch (error) {
        console.error('Error deleting meal:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error deleting meal: ' + error.message,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          position: 'center',
          allowOutsideClick: false,
        });
      }
    }
  };

  const handleUpdateInventoryItem = (item) => {
    setEditingItem(item);
    setFormData({
      productName: item.Product?.product_name || '',
      category: item.Product?.category || '',
      unitType: item.Product?.unit_type || '',
      quantity: item.quantity.toString(),
      expirationDate: item.expiration_date,
    });
    setShowAddItemModal(true);
  };

  const handleUpdateMeal = (meal) => {
    setEditingMeal(meal);
    setMealData({
      mealName: meal.meal_name,
      mealDate: meal.meal_date,
      ingredients: [],
    });
    const mealIngredientsIds = meal.Meal_Ingredient?.map((ing) => ({
      product_id: ing.product_id,
      quantity: ing.quantity_required,
    })) || [];
    setSelectedIngredients(mealIngredientsIds);
    setShowAddMealModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{modalStyles}</style>
      <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your grocery overview.</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Expiring Soon Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Expiring Soon</h2>
              {expiringItems.length > 0 ? (
                <div className="space-y-3">
                  {expiringItems.map((item) => (
                    <div key={item.inventory_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.Product?.product_name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${getDaysUntilExpiry(item.expiration_date) <= 3 ? 'text-red-600' : 'text-orange-600'}`}>
                            {getDaysUntilExpiry(item.expiration_date)} days
                          </p>
                          <p className="text-xs text-gray-600">{new Date(item.expiration_date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateInventoryItem(item)}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteInventoryItem(item.inventory_id)}
                            className="text-red-600 hover:text-red-800 font-semibold text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 py-8 text-center">No items expiring soon. Great job!</p>
              )}
            </div>

            {/* Upcoming Meal Reminders */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Meal Reminders</h2>
              {upcomingMeals.length > 0 ? (
                <div className="space-y-3">
                  {upcomingMeals.slice(0, 5).map((meal) => (
                    <div key={meal.meal_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{meal.meal_name}</p>
                        <p className="text-sm text-gray-600">{new Date(meal.meal_date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                          {meal.Meal_Ingredient?.length || 0} ingredients
                        </span>
                        <button
                          onClick={() => handleUpdateMeal(meal)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteMeal(meal.meal_id)}
                          className="text-red-600 hover:text-red-800 font-semibold text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 py-8 text-center">No upcoming meals planned.</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button onClick={() => setShowAddItemModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition cursor-pointer">
                  + Add Item
                </button>
                <button onClick={() => setShowAddMealModal(true)} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition cursor-pointer">
                  + Add Meal
                </button>
                <button onClick={handleGenerateGroceryList} disabled={loadingAction} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition cursor-pointer disabled:opacity-50">
                  📋 Generate List
                </button>
              </div>
            </div>

            {/* Suggested Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Suggested Items</h2>
              {suggestedItems.length > 0 ? (
                <div className="space-y-2">
                  {suggestedItems.map((item, idx) => (
                    <div key={idx} className="p-2 bg-blue-50 rounded-lg text-sm">
                      <p className="font-semibold text-gray-900">Item {idx + 1}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity_needed}</p>
                      <p className="text-xs text-blue-700 mt-1">{item.meals.slice(0, 2).join(', ')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-6 text-sm">No suggestions yet.</p>
              )}
            </div>

            {/* Insights */}
            {insights && (
              <div className="bg-blue-600 rounded-lg shadow-md p-6 text-white">
                <h2 className="text-xl font-bold mb-4">Quick Insights</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm opacity-90">Waste Reduction</p>
                    <p className="text-3xl font-bold">{insights.wasteReduction}%</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Estimated Money Saved</p>
                    <p className="text-3xl font-bold">₱{insights.moneySaved || 0}</p>
                  </div>
                  <div className="text-xs opacity-75 pt-2 border-t border-white/20">
                    Based on {insights.totalItems || 0} tracked items
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-38">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingItem ? 'Edit Item' : 'Add Item to Inventory'}
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Product name *"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Dairy">Dairy</option>
                <option value="Meat & Fish">Meat & Fish</option>
                <option value="Grains & Bread">Grains & Bread</option>
                <option value="Pantry">Pantry</option>
                <option value="Beverages">Beverages</option>
                <option value="Frozen">Frozen</option>
                <option value="Condiments">Condiments</option>
                <option value="Snacks">Snacks</option>
              </select>
              <select
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select unit type</option>
                <option value="kg">kg</option>
                <option value="liter">liter</option>
                <option value="piece/unit">piece/unit</option>
                <option value="grams">grams</option>
                <option value="cups">cups</option>
                <option value="bottles">bottles</option>
                <option value="boxes">boxes</option>
              </select>
              <input
                type="number"
                placeholder="Quantity *"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAddItem}
                  disabled={loadingAction}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {loadingAction ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
                <button
                  onClick={() => {
                    setShowAddItemModal(false);
                    setEditingItem(null);
                    setFormData({
                      productName: '',
                      category: '',
                      unitType: '',
                      quantity: '',
                      expirationDate: '',
                    });
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Meal Modal */}
      {showAddMealModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-38">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-96 overflow-y-hidden">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingMeal ? 'Edit Meal' : 'Add Meal'}
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Meal name *"
                value={mealData.mealName}
                onChange={(e) => setMealData({ ...mealData, mealName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="date"
                value={mealData.mealDate}
                onChange={(e) => setMealData({ ...mealData, mealDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Select Ingredients *</label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2">
              {products && products.length > 0 ? (
                products.map((product) => (
                  <label key={product.product_id} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIngredients.some((ing) => ing.product_id === product.product_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIngredients([
                            ...selectedIngredients,
                            { product_id: product.product_id, quantity: 1 },
                          ]);
                        } else {
                          setSelectedIngredients(
                            selectedIngredients.filter((ing) => ing.product_id !== product.product_id)
                          );
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{product.product_name}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-600">No items in inventory. Add items to your inventory first.</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddMeal}
              disabled={loadingAction}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loadingAction ? 'Saving...' : editingMeal ? 'Update Meal' : 'Add Meal'}
            </button>
            <button
              onClick={() => {
                setShowAddMealModal(false);
                setEditingMeal(null);
                setSelectedIngredients([]);
              }}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
