import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import Swal from 'sweetalert2';
import {
  fetchInventoryItems,
  addInventoryItem,
  updateInventoryQuantity,
  deleteInventoryItem,
  getExpiringItems,
  getExpiredItems,
  getRecipeSuggestionsForExpiringItems,
  moveGroceryItemToInventory,
  getInventorySummary,
  daysUntilExpiration,
  getExpirationStatusColor,
  getExpirationStatusLabel,
} from '../utils/inventoryUtils';
import { getAllProducts, getOrCreateProduct } from '../utils/groceryListUtils';

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Meat & Fish', 'Grains & Bread', 'Pantry', 'Beverages', 'Frozen', 'Condiments', 'Snacks', 'Other'];

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
`;

export default function Inventory() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [expiredItems, setExpiredItems] = useState([]);
  const [recipeSuggestions, setRecipeSuggestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showMoveFromGrocery, setShowMoveFromGrocery] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [groceryItems, setGroceryItems] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    productName: '',
    category: 'Other',
    quantity: '1',
    unit: 'pcs',
    expirationDate: '',
  });

  const [moveFormData, setMoveFormData] = useState({
    groceryItemId: '',
    quantity: '1',
    expirationDate: '',
  });

  const [editFormData, setEditFormData] = useState({
    productName: '',
    category: 'Other',
    quantity: '1',
    unit: 'pcs',
    expirationDate: '',
  });

  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate('/landing');
        } else {
          setUser(currentUser);
          await fetchAllData(currentUser.id);
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/landing');
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [navigate]);

  // Fetch all inventory data
  const fetchAllData = async (userId) => {
    try {
      const [inventory, expiring, expired, allProducts] = await Promise.all([
        fetchInventoryItems(userId),
        getExpiringItems(userId, 7),
        getExpiredItems(userId),
        getAllProducts(),
      ]);

      setInventoryItems(inventory);
      setExpiringItems(expiring);
      setExpiredItems(expired);
      setProducts(allProducts);

      // Get recipe suggestions for expiring items
      if (expiring.length > 0) {
        const suggestions = await getRecipeSuggestionsForExpiringItems(userId, 3);
        setRecipeSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load inventory',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
    }
  };

  // Fetch grocery items for moving to inventory
  const fetchGroceryItems = async (userId) => {
    try {
      const { data: lists, error: listError } = await supabase
        .from('Grocery_List')
        .select('list_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1);

      if (listError) throw listError;

      if (lists && lists.length > 0) {
        const { data: items, error: itemError } = await supabase
          .from('Grocery_List_Item')
          .select(`
            gl_item_id,
            list_id,
            product_id,
            quantity_needed,
            is_checked,
            Product(product_id, product_name, category, unit_type)
          `)
          .eq('list_id', lists[0].list_id)
          .eq('is_checked', true);

        if (itemError) throw itemError;
        setGroceryItems(items || []);
      }
    } catch (error) {
      console.error('Error fetching grocery items:', error);
    }
  };

  // Filter items based on category and search
  useEffect(() => {
    let filtered = inventoryItems;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.Product?.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.Product?.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [inventoryItems, selectedCategory, searchTerm]);

  // Handle add item form submission
  const handleAddItem = async (e) => {
    e.preventDefault();

    if (!formData.productName.trim() || !formData.expirationDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all fields',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      return;
    }

    setActionLoading(true);
    try {
      // Get or create product
      const product = await getOrCreateProduct(
        formData.productName,
        formData.category,
        formData.unit
      );

      // Add to inventory
      await addInventoryItem(
        user.id,
        product.product_id,
        parseFloat(formData.quantity),
        formData.expirationDate
      );

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Item added to inventory',
        position: 'center',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      setFormData({
        productName: '',
        category: 'Other',
        quantity: '1',
        unit: 'pcs',
        expirationDate: '',
      });
      setShowAddItem(false);
      await fetchAllData(user.id);
    } catch (error) {
      console.error('Error adding item:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add item',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle move from grocery list
  const handleMoveFromGrocery = async (e) => {
    e.preventDefault();

    if (!moveFormData.groceryItemId || !moveFormData.expirationDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please select an item and expiration date',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      return;
    }

    setActionLoading(true);
    try {
      const selectedItem = groceryItems.find(
        item => item.gl_item_id === moveFormData.groceryItemId
      );

      await moveGroceryItemToInventory(
        user.id,
        selectedItem.gl_item_id,
        selectedItem.product_id,
        parseFloat(moveFormData.quantity) || selectedItem.quantity_needed,
        moveFormData.expirationDate
      );

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Item moved to inventory',
        position: 'center',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      setMoveFormData({
        groceryItemId: '',
        quantity: '1',
        expirationDate: '',
      });
      setShowMoveFromGrocery(false);
      await fetchAllData(user.id);
      await fetchGroceryItems(user.id);
    } catch (error) {
      console.error('Error moving item:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to move item',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update quantity
  const handleUpdateQuantity = async (inventoryId, newQuantity) => {
    if (newQuantity < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Quantity must be positive',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      return;
    }

    if (newQuantity === 0) {
      const result = await Swal.fire({
        title: 'Remove Item?',
        text: 'Setting quantity to 0 will remove the item. Continue?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Remove',
        cancelButtonText: 'Cancel',
        position: 'center',
        allowOutsideClick: false,
      });

      if (!result.isConfirmed) return;
    }

    setActionLoading(true);
    try {
      if (newQuantity === 0) {
        await deleteInventoryItem(inventoryId);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Item removed',
          position: 'center',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: false,
        });
      } else {
        await updateInventoryQuantity(inventoryId, newQuantity);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Quantity updated',
          position: 'center',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          allowOutsideClick: false,
        });
      }
      await fetchAllData(user.id);
    } catch (error) {
      console.error('Error updating quantity:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update quantity',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete item
  const handleDeleteItem = async (inventoryId) => {
    const result = await Swal.fire({
      title: 'Delete Item?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      position: 'center',
      allowOutsideClick: false,
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await deleteInventoryItem(inventoryId);
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Item deleted',
        position: 'center',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      await fetchAllData(user.id);
    } catch (error) {
      console.error('Error deleting item:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete item',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle open edit modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setEditFormData({
      productName: item.Product?.product_name || '',
      category: item.Product?.category || 'Other',
      quantity: item.quantity.toString(),
      unit: item.unit_type || 'pcs',
      expirationDate: item.expiration_date || '',
    });
    setShowEditItem(true);
  };

  // Handle edit item
  const handleEditItem = async (e) => {
    e.preventDefault();

    if (!editFormData.productName.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter a product name',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      return;
    }

    if (parseFloat(editFormData.quantity) <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Quantity must be greater than 0',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      return;
    }

    setActionLoading(true);
    try {
      // Update the inventory item
      const { error } = await supabase
        .from('Inventory')
        .update({
          quantity: parseFloat(editFormData.quantity),
          expiration_date: editFormData.expirationDate,
          unit_type: editFormData.unit,
        })
        .eq('inventory_id', editingItem.inventory_id);

      if (error) throw error;

      // If product name or category changed, update/create product
      if (editFormData.productName !== editingItem.Product?.product_name || 
          editFormData.category !== editingItem.Product?.category) {
        const productData = await getOrCreateProduct(editFormData.productName, editFormData.category);
        
        if (productData) {
          const { error: updateError } = await supabase
            .from('Inventory')
            .update({ product_id: productData.product_id })
            .eq('inventory_id', editingItem.inventory_id);

          if (updateError) throw updateError;
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Item updated successfully',
        position: 'center',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      setShowEditItem(false);
      setEditingItem(null);
      await fetchAllData(user.id);
    } catch (error) {
      console.error('Error editing item:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update item',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle open move modal
  const handleOpenMoveModal = async () => {
    await fetchGroceryItems(user.id);
    setShowMoveFromGrocery(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  const getItemStats = () => {
    return {
      total: inventoryItems.length,
      expiring: expiringItems.length,
      expired: expiredItems.length,
      totalQuantity: inventoryItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  };

  const stats = getItemStats();

  // Get status badge styles
  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'good':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'critical':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'expired':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  return (
    <>
      <style>{modalStyles}</style>
      <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">My Inventory</h1>
          <p className="text-sm md:text-lg text-gray-600">Track what you have at home and reduce food waste</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm font-medium">Total Items</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                <p className="text-gray-500 text-xs mt-1">{stats.totalQuantity} units</p>
              </div>
              <div className="text-3xl md:text-4xl">📦</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm font-medium">Expiring Soon</p>
                <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-2">{stats.expiring}</p>
                <p className="text-gray-500 text-xs mt-1">Next 7 days</p>
              </div>
              <div className="text-3xl md:text-4xl">⏰</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm font-medium">Expired</p>
                <p className="text-2xl md:text-3xl font-bold text-red-600 mt-2">{stats.expired}</p>
                <p className="text-gray-500 text-xs mt-1">Remove Items</p>
              </div>
              <div className="text-2xl md:text-3xl">❌</div>
            </div>
          </div>
        </div>

        {/* Tabs - Mobile Scrollable */}
        <div className="flex gap-1 md:gap-2 mb-6 md:mb-8 pb-3 md:pb-4 border-b border-gray-200 overflow-x-auto -mx-4 px-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 md:px-6 py-2 md:py-3 font-medium text-xs md:text-base rounded-t-lg transition whitespace-nowrap shrink-0 ${
              activeTab === 'all'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 All Items
          </button>
          <button
            onClick={() => setActiveTab('expiring')}
            className={`px-3 md:px-6 py-2 md:py-3 font-medium text-xs md:text-base rounded-t-lg transition whitespace-nowrap shrink-0 ${
              activeTab === 'expiring'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⏰ Expiring {stats.expiring > 0 && `(${stats.expiring})`}
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`px-3 md:px-6 py-2 md:py-3 font-medium text-xs md:text-base rounded-t-lg transition whitespace-nowrap shrink-0 ${
              activeTab === 'expired'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ❌ Expired {stats.expired > 0 && `(${stats.expired})`}
          </button>
          {recipeSuggestions.length > 0 && (
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-3 md:px-6 py-2 md:py-3 font-medium text-xs md:text-base rounded-t-lg transition whitespace-nowrap shrink-0 ${
                activeTab === 'recipes'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🍳 Recipes ({recipeSuggestions.length})
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mb-4 md:mb-6">
          {groceryItems.length > 0 && (
            <button
              onClick={handleOpenMoveModal}
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 md:py-3 px-4 md:px-6 rounded-lg shadow-md transition transform hover:scale-105 mb-3 md:mb-4 block text-sm md:text-base"
            >
              📦 Move from Shopping ({groceryItems.length})
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <input
              type="text"
              placeholder="🔍 Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm md:text-base text-black"
              style={{ color: '#000000' }}
            >
              <option value="All" style={{ color: '#000000', backgroundColor: '#ffffff' }}>All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} style={{ color: '#000000', backgroundColor: '#ffffff' }}>{cat}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAddItem(true)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 md:py-3 px-4 md:px-6 rounded-lg shadow-md transition transform hover:scale-105 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <span className="text-lg md:text-xl">+</span> Add Item
            </button>
          </div>
        </div>

        {/* Content by Tab */}
        {activeTab === 'all' && (
          <div>
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-600 text-lg">No items in inventory</p>
                <p className="text-gray-500 mt-2">Start by adding items or moving from your shopping list!</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Item Name</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Category</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Quantity</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Expiration</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, idx) => (
                        <tr key={item.inventory_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 text-center text-sm text-gray-900 font-medium">{item.Product?.product_name}</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">{item.Product?.category}</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.inventory_id, item.quantity - 1)}
                                disabled={actionLoading}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.inventory_id, item.quantity + 1)}
                                disabled={actionLoading}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">{new Date(item.expiration_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-center text-sm">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(getExpirationStatusColor(item.expiration_date))}`}>
                              {getExpirationStatusLabel(item.expiration_date)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm">
                            <div className="flex gap-2 justify-center\">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                disabled={actionLoading}
                                className="text-blue-600 hover:text-blue-800 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.inventory_id)}
                                disabled={actionLoading}
                                className="text-red-600 hover:text-red-800 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'expiring' && (
          <div>
            {expiringItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <div className="text-5xl mb-4">✨</div>
                <p className="text-gray-600 text-lg">Great! No items expiring soon</p>
                <p className="text-gray-500 mt-2">Your inventory is all good for the next 7 days</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-center">
                    <thead className="bg-yellow-50 border-b border-yellow-200">
                      <tr>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Item Name</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Category</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Quantity</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Expiration</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiringItems.map((item, idx) => (
                        <tr key={item.inventory_id} className={`border-b border-yellow-100 ${idx % 2 === 0 ? 'bg-yellow-50' : 'bg-white'}`}>
                          <td className="px-6 py-4 text-center text-sm text-gray-900 font-medium">{item.Product?.product_name}</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">{item.Product?.category}</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.inventory_id, item.quantity - 1)}
                                disabled={actionLoading}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.inventory_id, item.quantity + 1)}
                                disabled={actionLoading}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(item.expiration_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(getExpirationStatusColor(item.expiration_date))}`}>
                              {getExpirationStatusLabel(item.expiration_date)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                disabled={actionLoading}
                                className="text-blue-600 hover:text-blue-800 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.inventory_id)}
                                disabled={actionLoading}
                                className="text-red-600 hover:text-red-800 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'expired' && (
          <div>
            {expiredItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-gray-600 text-lg">Perfect! No expired items</p>
                <p className="text-gray-500 mt-2">Your inventory is clean and fresh</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-center">\n                    <thead className="bg-red-50 border-b border-red-200">
                      <tr>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Item Name</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Category</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Quantity</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Expired On</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Days Ago</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiredItems.map((item, idx) => (
                        <tr key={item.inventory_id} className={`border-b border-red-100 ${idx % 2 === 0 ? 'bg-red-50' : 'bg-white'}`}>
                          <td className="px-6 py-4 text-center text-sm text-gray-900 font-medium">{item.Product?.product_name}</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">{item.Product?.category}</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">{item.quantity}</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">{new Date(item.expiration_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-red-600">{Math.abs(daysUntilExpiration(item.expiration_date))} days</td>
                          <td className="px-6 py-4 text-center text-sm">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                disabled={actionLoading}
                                className="text-blue-600 hover:text-blue-800 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.inventory_id)}
                                disabled={actionLoading}
                                className="text-red-600 hover:text-red-800 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recipes' && (
          <div>
            {recipeSuggestions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <div className="text-5xl mb-4">🍳</div>
                <p className="text-gray-600 text-lg">No recipes found</p>
                <p className="text-gray-500 mt-2">Add items that are expiring soon and recipes will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipeSuggestions.map(meal => (
                  <div key={meal.meal_id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                    <div className="text-3xl mb-3">🍽️</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{meal.meal_name}</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {meal.meal_date ? new Date(meal.meal_date).toLocaleDateString() : 'No date scheduled'}
                    </p>
                    <button
                      onClick={() => navigate(`/meal-planner?meal=${meal.meal_id}`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      View Recipe
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Item Modal */}
        {showAddItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 pt-20" style={{ backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-black mb-6">➕ Add Item to Inventory</h2>
              <form onSubmit={handleAddItem}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="e.g., Milk, Chicken Breast"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                      style={{ color: '#000000' }}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} style={{ color: '#000000', backgroundColor: '#ffffff' }}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Quantity *</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="1"
                      step="0.1"
                      min="0"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    style={{ color: '#000000' }}
                  >
                    <option value="pcs" style={{ color: '#000000', backgroundColor: '#ffffff' }}>pcs</option>
                    <option value="kg" style={{ color: '#000000', backgroundColor: '#ffffff' }}>kg</option>
                    <option value="g" style={{ color: '#000000', backgroundColor: '#ffffff' }}>g</option>
                    <option value="L" style={{ color: '#000000', backgroundColor: '#ffffff' }}>L</option>
                    <option value="ml" style={{ color: '#000000', backgroundColor: '#ffffff' }}>ml</option>
                    <option value="cup" style={{ color: '#000000', backgroundColor: '#ffffff' }}>cup</option>
                    <option value="tbsp" style={{ color: '#000000', backgroundColor: '#ffffff' }}>tbsp</option>
                    <option value="tsp" style={{ color: '#000000', backgroundColor: '#ffffff' }}>tsp</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Expiration Date *</label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddItem(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Adding...' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Move from Grocery Modal */}
        {showMoveFromGrocery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 pt-20" style={{ backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📦 Move from Shopping List</h2>
              <form onSubmit={handleMoveFromGrocery}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Select Item *</label>
                  <select
                    value={moveFormData.groceryItemId}
                    onChange={(e) => setMoveFormData({ ...moveFormData, groceryItemId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                    style={{ color: '#000000' }}
                  >
                    <option value="" style={{ color: '#000000', backgroundColor: '#ffffff' }}>Select an item...</option>
                    {groceryItems.map(item => (
                      <option key={item.gl_item_id} value={item.gl_item_id} style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                        {item.Product?.product_name} (Qty: {item.quantity_needed})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Quantity</label>
                    <input
                      type="number"
                      value={moveFormData.quantity}
                      onChange={(e) => setMoveFormData({ ...moveFormData, quantity: e.target.value })}
                      placeholder="1"
                      step="0.1"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Expiration Date *</label>
                    <input
                      type="date"
                      value={moveFormData.expirationDate}
                      onChange={(e) => setMoveFormData({ ...moveFormData, expirationDate: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMoveFromGrocery(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Moving...' : 'Move to Inventory'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {showEditItem && editingItem && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 flex items-start justify-center p-4 z-50 pt-20" style={{ backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">✏️ Edit Item</h2>
              <form onSubmit={handleEditItem}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={editFormData.productName}
                    onChange={(e) => setEditFormData({ ...editFormData, productName: e.target.value })}
                    placeholder="e.g., Milk, Chicken Breast"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Category *</label>
                    <select
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Quantity *</label>
                    <input
                      type="number"
                      value={editFormData.quantity}
                      onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                      placeholder="1"
                      step="0.1"
                      min="0"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Unit *</label>
                  <select
                    value={editFormData.unit}
                    onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="pcs">Pieces</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="cup">Cup</option>
                    <option value="tbsp">Tablespoon (tbsp)</option>
                    <option value="tsp">Teaspoon (tsp)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Expiration Date *</label>
                  <input
                    type="date"
                    value={editFormData.expirationDate}
                    onChange={(e) => setEditFormData({ ...editFormData, expirationDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditItem(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Updating...' : 'Update Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}




