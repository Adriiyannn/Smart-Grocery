import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import Swal from 'sweetalert2';
import {
  getOrCreateActiveList,
  createActiveList,
  fetchGroceryListItems,
  getOrCreateProduct,
  bulkAddItemsToList,
  addGroceryListItem,
  toggleItemChecked,
  removeGroceryListItem,
  getUserPurchaseHabits,
  getUpcomingMealIngredients,
  getAllProducts,
} from '../utils/groceryListUtils';
import {
  STORE_OPTIONS,
  calculateTotalEstimate,
  formatPrice,
  estimatePrice,
} from '../utils/storeUtils';

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Meat & Fish', 'Grains & Bread', 'Pantry', 'Beverages', 'Frozen', 'Condiments', 'Snacks'];

const checkboxStyles = `
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
    accent-color: #16a34a;
  }
  
  input[type="checkbox"]:checked {
    background-color: #16a34a !important;
    border-color: #16a34a !important;
    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 20 20' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' fill='white'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100% 100%;
  }
`;

export default function GroceryList() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeList, setActiveList] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStore, setSelectedStore] = useState('robinsons');
  const [customStores, setCustomStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [habits, setHabits] = useState([]);
  const [mealIngredients, setMealIngredients] = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAutoGen, setShowAutoGen] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreIcon, setNewStoreIcon] = useState('🏬');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItemData, setEditingItemData] = useState(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [editingCategory, setEditingCategory] = useState('');
  const [editingItemProductId, setEditingItemProductId] = useState(null);

  const [formData, setFormData] = useState({
    productName: '',
    category: 'Other',
    unitType: 'qty',
    quantity: 1,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        await fetchGroceryListData(session.user.id);
        await fetchAllProducts();
        await fetchHabits(session.user.id);
        await fetchMealIngredients(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          fetchGroceryListData(session.user.id);
          fetchAllProducts();
          fetchHabits(session.user.id);
          fetchMealIngredients(session.user.id);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // Filter items based on search and category
  useEffect(() => {
    let filtered = listItems;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.Product?.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.Product?.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [listItems, selectedCategory, searchTerm]);

  const fetchGroceryListData = async (userId) => {
    try {
      const list = await getOrCreateActiveList(userId);
      setActiveList(list);

      // Only fetch items if list exists
      if (list) {
        const items = await fetchGroceryListItems(list.list_id);

        // Sort by category
        const sorted = items.sort((a, b) => {
          const catA = a.Product?.category || 'Other';
          const catB = b.Product?.category || 'Other';
          return catA.localeCompare(catB);
        });

        setListItems(sorted);
      } else {
        setListItems([]);
      }
    } catch (error) {
      console.error('Error fetching grocery list:', error);
      Swal.fire('Error', 'Failed to load grocery list', 'error');
    }
  };

  const fetchAllProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchHabits = async (userId) => {
    try {
      const habitList = await getUserPurchaseHabits(userId, 10);
      setHabits(habitList);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchMealIngredients = async (userId) => {
    try {
      const ingredients = await getUpcomingMealIngredients(userId, 7);
      setMealIngredients(ingredients);
    } catch (error) {
      console.error('Error fetching meal ingredients:', error);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();

    if (!formData.productName.trim()) {
      Swal.fire('Validation', 'Please enter a product name', 'warning');
      return;
    }

    setActionLoading(true);

    try {
      // Create list if it doesn't exist
      let list = activeList;
      if (!list && user) {
        list = await createActiveList(user.id);
        setActiveList(list);
      }

      if (!list) {
        Swal.fire('Error', 'Could not create grocery list', 'error');
        return;
      }

      const product = await getOrCreateProduct(
        formData.productName,
        formData.category,
        formData.unitType
      );

      // Add to local products list if new
      if (!products.find(p => p.product_id === product.product_id)) {
        setProducts([...products, product]);
      }

      const data = await addGroceryListItem(list.list_id, product.product_id, formData.quantity);

      setListItems([...listItems, data]);
      setFormData({
        productName: '',
        category: 'Other',
        unitType: 'qty',
        quantity: 1,
      });
      setShowAddItem(false);

      Swal.fire('Success', 'Item added to list', 'success');
    } catch (error) {
      console.error('Error adding item:', error);
      Swal.fire('Error', 'Failed to add item', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleItem = async (itemId, isChecked) => {
    try {
      await toggleItemChecked(itemId, isChecked);

      setListItems(listItems.map(item =>
        item.gl_item_id === itemId ? { ...item, is_checked: !isChecked } : item
      ));
    } catch (error) {
      console.error('Error toggling item:', error);
      Swal.fire('Error', 'Failed to update item', 'error', { position: 'top', timer: 3000, timerProgressBar: true, allowOutsideClick: false });
    }
  };

  const handleDeleteItem = async (itemId) => {
    const result = await Swal.fire({
      title: 'Remove Item?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove',
      position: 'top',
      allowOutsideClick: false,
    });

    if (!result.isConfirmed) return;

    try {
      await removeGroceryListItem(itemId);

      setListItems(listItems.filter(item => item.gl_item_id !== itemId));
      Swal.fire('Success', 'Item removed', 'success', { position: 'top', timer: 3000, timerProgressBar: true, allowOutsideClick: false });
    } catch (error) {
      console.error('Error deleting item:', error);
      Swal.fire('Error', 'Failed to remove item', 'error', { position: 'top', timer: 3000, timerProgressBar: true, allowOutsideClick: false });
    }
  };

  const handleEditItem = (item) => {
    setEditingItemData(item);
    setEditingItemName(item.Product?.product_name || '');
    setEditingCategory(item.Product?.category || '');
    setEditingItemProductId(item.Product?.product_id);
    setEditingQuantity(item.quantity_needed);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      setActionLoading(true);

      // Validate inputs
      if (!editingItemName.trim()) {
        Swal.fire('Validation', 'Please enter an item name', 'warning');
        setActionLoading(false);
        return;
      }

      if (!editingCategory.trim()) {
        Swal.fire('Validation', 'Please select a category', 'warning');
        setActionLoading(false);
        return;
      }

      if (editingQuantity <= 0) {
        Swal.fire('Validation', 'Quantity must be greater than 0', 'warning');
        setActionLoading(false);
        return;
      }

      // Update the item quantity in database
      const { error: quantityError } = await supabase
        .from('Grocery_List_Item')
        .update({ quantity_needed: editingQuantity })
        .eq('gl_item_id', editingItemData.gl_item_id);

      if (quantityError) throw quantityError;

      // Update the product name and category in database if they changed
      if (editingItemProductId && (editingItemName !== editingItemData.Product?.product_name || editingCategory !== editingItemData.Product?.category)) {
        const { error: productError } = await supabase
          .from('Product')
          .update({
            product_name: editingItemName,
            category: editingCategory,
          })
          .eq('product_id', editingItemProductId);

        if (productError) throw productError;
      }

      // Update the item in the list state
      setListItems(listItems.map(item =>
        item.gl_item_id === editingItemData.gl_item_id
          ? {
              ...item,
              quantity_needed: editingQuantity,
              Product: {
                ...item.Product,
                product_name: editingItemName,
                category: editingCategory,
              },
            }
          : item
      ));

      setShowEditModal(false);
      setEditingItemData(null);
      Swal.fire('Success', 'Item updated', 'success');
    } catch (error) {
      console.error('Error updating item:', error);
      Swal.fire('Error', 'Failed to update item', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingItemData(null);
    setEditingItemName('');
    setEditingCategory('');
    setEditingItemProductId(null);
    setEditingQuantity(1);
  };

  const handleAutoGenerateFromHabits = async () => {
    if (!user) return;

    setActionLoading(true);

    try {
      // Create list if it doesn't exist
      let list = activeList;
      if (!list) {
        list = await createActiveList(user.id);
        setActiveList(list);
      }

      const itemsToAdd = [];

      // Add items from habits (user's frequent purchases)
      for (const productId of habits.slice(0, 10)) {
        const product = products.find(p => p.product_id === productId);
        if (product) {
          // Check if already in list
          const exists = listItems.some(item => item.product_id === productId);
          if (!exists) {
            itemsToAdd.push({
              list_id: list.list_id,
              product_id: productId,
              quantity_needed: 1,
              is_checked: false,
            });
          }
        }
      }

      if (itemsToAdd.length === 0) {
        Swal.fire('Info', 'All items from habits are already in your list', 'info');
        return;
      }

      const data = await bulkAddItemsToList(list.list_id, itemsToAdd);

      setListItems([...listItems, ...data]);
      setShowAutoGen(false);

      Swal.fire('Success', `Added ${data.length} items from your habits`, 'success');
    } catch (error) {
      console.error('Error auto-generating list:', error);
      Swal.fire('Error', 'Failed to generate list', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoGenerateFromMeals = async () => {
    if (!user) {
      Swal.fire('Info', 'No active grocery list', 'info');
      return;
    }

    setActionLoading(true);

    try {
      // Create list if it doesn't exist
      let list = activeList;
      if (!list) {
        list = await createActiveList(user.id);
        setActiveList(list);
      }

      const itemsToAdd = [];

      for (const ingredient of mealIngredients) {
        if (ingredient.product_id) {
          const exists = listItems.some(item => item.product_id === ingredient.product_id);
          if (!exists) {
            itemsToAdd.push({
              list_id: list.list_id,
              product_id: ingredient.product_id,
              quantity_needed: ingredient.quantity_required || 1,
              is_checked: false,
            });
          }
        }
      }

      if (itemsToAdd.length === 0) {
        Swal.fire('Info', 'All meal ingredients are already in your list', 'info');
        return;
      }

      const data = await bulkAddItemsToList(list.list_id, itemsToAdd);

      setListItems([...listItems, ...data]);

      Swal.fire('Success', `Added ${data.length} items from upcoming meals`, 'success');
    } catch (error) {
      console.error('Error adding meal ingredients:', error);
      Swal.fire('Error', 'Failed to add meal ingredients', 'error', { position: 'top', timer: 3000, timerProgressBar: true, allowOutsideClick: false });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearChecked = async () => {
    const result = await Swal.fire({
      title: 'Clear Purchased Items?',
      text: 'Remove all checked items from the list',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Clear',
      position: 'top',
      allowOutsideClick: false,
    });

    if (!result.isConfirmed) return;

    try {
      const checkedIds = listItems.filter(item => item.is_checked).map(item => item.gl_item_id);

      if (checkedIds.length === 0) {
        Swal.fire('Info', 'No items marked as purchased', 'info', { position: 'top', timer: 3000, timerProgressBar: true, allowOutsideClick: false });
        return;
      }

      const { error } = await supabase
        .from('Grocery_List_Item')
        .delete()
        .in('gl_item_id', checkedIds);

      if (error) throw error;

      setListItems(listItems.filter(item => !item.is_checked));
      Swal.fire('Success', `Removed ${checkedIds.length} items`, 'success', { position: 'top', timer: 3000, timerProgressBar: true, allowOutsideClick: false });
    } catch (error) {
      console.error('Error clearing checked items:', error);
      Swal.fire('Error', 'Failed to clear items', 'error', { position: 'top', timer: 3000, timerProgressBar: true, allowOutsideClick: false });
    }
  };

  const handleExportList = () => {
    try {
      let csv = 'Category,Item,Quantity,Unit,Purchased\n';

      filteredItems.forEach(item => {
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
      a.download = `grocery-list-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      Swal.fire('Success', 'List exported to CSV', 'success', { position: 'top', timer: 3000, timerProgressBar: true, allowOutsideClick: false });
    } catch (error) {
      console.error('Error exporting list:', error);
      Swal.fire('Error', 'Failed to export list', 'error', { position: 'top', timer: 3000, timerProgressBar: true, allowOutsideClick: false });
    }
  };

  const handleShareList = async () => {
    try {
      const listText = filteredItems
        .map(item => `${item.Product?.product_name || 'Unknown'} (${item.quantity_needed || 1} ${item.Product?.unit_type || 'qty'})`)
        .join('\n');

      if (navigator.share) {
        await navigator.share({
          title: 'My Grocery List',
          text: `Here's my grocery list:\n\n${listText}`,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(listText);
        Swal.fire('Success', 'List copied to clipboard', 'success', { position: 'top', timer: 3000, timerProgressBar: true, allowOutsideClick: false });
      }
    } catch (error) {
      console.error('Error sharing list:', error);
    }
  };

  const handleAddStore = (e) => {
    e.preventDefault();

    if (!newStoreName.trim()) {
      Swal.fire('Validation', 'Please enter a store name', 'warning', { position: 'top', timer: 3000, timerProgressBar: true, allowOutsideClick: false });
      return;
    }

    const newStore = {
      id: `custom_${Date.now()}`,
      name: newStoreName,
      icon: newStoreIcon,
      isCustom: true,
    };

    setCustomStores([...customStores, newStore]);
    setSelectedStore(newStore.id);
    setNewStoreName('');
    setNewStoreIcon('🏬');
    setShowAddStore(false);

    Swal.fire('Success', `Store "${newStoreName}" added!`, 'success', { position: 'top', timer: 3000, timerProgressBar: true, allowOutsideClick: false });
  };

  const handleRemoveStore = (storeId) => {
    Swal.fire({
      title: 'Remove Store?',
      text: 'Are you sure you want to remove this store?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove',
      position: 'top',
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        setCustomStores(customStores.filter(s => s.id !== storeId));
        if (selectedStore === storeId) {
          setSelectedStore('walmart');
        }
        Swal.fire('Success', 'Store removed', 'success', { position: 'top', timer: 3000, timerProgressBar: true, allowOutsideClick: false });
      }
    });
  };

  const allStores = [...STORE_OPTIONS, ...customStores];

  const checkedCount = listItems.filter(item => item.is_checked).length;
  const totalCount = listItems.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading grocery list...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{checkboxStyles}</style>
      <div className="min-h-screen bg-white">

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">My Grocery List</h1>
              <p className="text-gray-600">
                {checkedCount} of {totalCount} items purchased
              </p>
            </div>
            
            {/* Store Selector and Price Estimate */}
            {/* Store Selector and Price Estimate */}
            <div className="mt-6 md:mt-0 flex gap-4 items-end">
              {/* Store Dropdown */}
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">CHOOSE STORE</label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-blue-500 text-gray-700 font-semibold bg-white transition appearance-none cursor-pointer pr-8"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 6px center',
                    backgroundSize: '16px',
                  }}
                >
                  {allStores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.icon}  {store.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowAddStore(true)}
                className="px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 text-gray-400 hover:text-green-600 font-semibold transition"
              >
                + Add
              </button>

              {/* Price Estimate */}
              <div className="bg-white border-2 border-gray-200 rounded-lg px-3 py-2 flex flex-col justify-center">
                <p className="text-xs font-semibold text-gray-500 leading-tight">ESTIMATED TOTAL</p>
                <p className="text-sm font-bold text-blue-600 leading-tight">{formatPrice(calculateTotalEstimate(listItems, selectedStore))}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : '0%' }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => setShowAddItem(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            + Add Item
          </button>
          <button
            onClick={() => setShowAutoGen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            ✨ Auto-Generate
          </button>
          <button
            onClick={handleExportList}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
          >
            📥 Export
          </button>
          <button
            onClick={handleShareList}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition"
          >
            🔗 Share
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                selectedCategory === 'All'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                type="button"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* List Items */}
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">No items in your list</p>
              <p className="text-gray-400 text-sm mt-2">Add items manually or use auto-generate to get started</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.gl_item_id}
                className={`flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition ${
                  item.is_checked ? 'bg-gray-100' : 'bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.is_checked || false}
                  onChange={() => handleToggleItem(item.gl_item_id, item.is_checked)}
                  className="w-5 h-5 cursor-pointer"
                />

                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold ${
                      item.is_checked ? 'line-through text-gray-500' : 'text-gray-800'
                    }`}
                  >
                    {item.Product?.product_name || 'Unknown Item'}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {item.Product?.category || 'Other'}
                    </span>
                    <span>
                      {item.quantity_needed} {item.Product?.unit_type || 'qty'}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                      {formatPrice(estimatePrice(
                        item.Product?.product_name || '',
                        item.Product?.category || 'Other',
                        selectedStore,
                        item.quantity_needed || 1
                      ))}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditItem(item)}
                    disabled={actionLoading}
                    className="px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition font-semibold"
                    title="Edit quantity"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.gl_item_id)}
                    disabled={actionLoading}
                    className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg transition font-semibold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Clear Checked Button */}
        {checkedCount > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleClearChecked}
              disabled={actionLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              ✓ Clear {checkedCount} Purchased Items
            </button>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Add Item to List</h2>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  list="product-names"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g., Milk, Apples, Chicken"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
                <datalist id="product-names">
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_name} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit Type
                  </label>
                  <select
                    value={formData.unitType}
                    onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="qty">Qty</option>
                    <option value="lbs">Lbs</option>
                    <option value="kg">Kg</option>
                    <option value="oz">Oz</option>
                    <option value="ml">ml</option>
                    <option value="l">L</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Generate Modal */}
      {showAutoGen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Auto-Generate List</h2>
            <p className="text-gray-600 mb-6">
              Generate items from your shopping habits and upcoming meals.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleAutoGenerateFromHabits}
                disabled={actionLoading || habits.length === 0}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
              >
                {habits.length === 0 ? 'No Purchase History' : `✨ Add from Habits (${habits.slice(0, 10).length} items)`}
              </button>

              <button
                onClick={handleAutoGenerateFromMeals}
                disabled={actionLoading || mealIngredients.length === 0}
                className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition disabled:opacity-50"
              >
                {mealIngredients.length === 0 ? 'No Upcoming Meals' : `🍽️ Add from Meals (${mealIngredients.length} items)`}
              </button>

              <button
                onClick={async () => {
                  await handleAutoGenerateFromHabits();
                  await handleAutoGenerateFromMeals();
                }}
                disabled={actionLoading || (habits.length === 0 && mealIngredients.length === 0)}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Add Both
              </button>
            </div>

            <button
              onClick={() => setShowAutoGen(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && editingItemData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Item</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  value={editingItemName}
                  onChange={(e) => setEditingItemName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={editingCategory}
                  onChange={(e) => setEditingCategory(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editingQuantity}
                    onChange={(e) => setEditingQuantity(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0.1"
                    step="0.1"
                  />
                  <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">
                    {editingItemData.Product?.unit_type || 'qty'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estimated Price
                </label>
                <p className="px-4 py-3 bg-green-50 rounded-lg text-green-700 font-bold text-lg">
                  {formatPrice(estimatePrice(
                    editingItemName || '',
                    editingCategory || 'Other',
                    selectedStore,
                    editingQuantity || 1
                  ))}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancelEdit}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Store Modal */}
      {showAddStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Store</h2>

            <form onSubmit={handleAddStore} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="e.g., Local Market, Food Depot"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Store Icon (Emoji)
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {['🏬', '🏪', '🛒', '🛍️', '📦', '🏢', '🍎', '🥕', '🧀', '🍖', '🚛', '⭐'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewStoreIcon(emoji)}
                      className={`px-3 py-2 rounded-lg border-2 transition text-xl ${
                        newStoreIcon === emoji
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddStore(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Adding...' : 'Add Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
