import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getSuggestionsByExpiringItems, scheduleMeal, getOrCreateProduct } from '../utils/mealPlannerUtils';

export default function ExpiringItemsSuggestions({ userId, onMealScheduled }) {
  const [expiringItems, setExpiringItems] = useState([]);
  const [suggestedRecipes, setSuggestedRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(3);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    fetchSuggestions();
  }, [userId, daysUntilExpiry]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const { expiringItems: items, suggestedRecipes: recipes } = await getSuggestionsByExpiringItems(
        userId,
        daysUntilExpiry
      );
      setExpiringItems(items);
      setSuggestedRecipes(recipes);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      Swal.fire('Error', 'Failed to fetch suggestions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleRecipe = async () => {
    if (!scheduleDate) {
      Swal.fire('Error', 'Please select a date', 'error');
      return;
    }

    try {
      setLoading(true);

      // Get ingredients from the selected recipe
      const recipeIngredients = selectedRecipe.Meal_Ingredient || [];
      const ingredients = recipeIngredients.map(ing => ({
        product_id: ing.product_id,
        quantity_required: ing.quantity_required,
      }));

      await scheduleMeal(userId, selectedRecipe.meal_name, scheduleDate, ingredients);

      setShowScheduleModal(false);
      setSelectedRecipe(null);
      setScheduleDate('');

      Swal.fire('Success', 'Meal scheduled using expiring items!', 'success');
      if (onMealScheduled) onMealScheduled();
      
      // Refresh suggestions
      fetchSuggestions();
    } catch (error) {
      console.error('Error scheduling recipe:', error);
      Swal.fire('Error', 'Failed to schedule meal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getExpiryColor = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntil = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 0) return 'bg-red-100 border-red-300';
    if (daysUntil <= 2) return 'bg-orange-100 border-orange-300';
    return 'bg-yellow-100 border-yellow-300';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Items Expiring Soon</h2>
        <div className="flex gap-2">
          <select
            value={daysUntilExpiry}
            onChange={(e) => setDaysUntilExpiry(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
            style={{ color: '#000000' }}
          >
            <option value={1} style={{ color: '#000000', backgroundColor: '#ffffff' }}>Expiring Today</option>
            <option value={2} style={{ color: '#000000', backgroundColor: '#ffffff' }}>Expiring Tomorrow</option>
            <option value={3} style={{ color: '#000000', backgroundColor: '#ffffff' }}>Next 3 Days</option>
            <option value={7} style={{ color: '#000000', backgroundColor: '#ffffff' }}>Next Week</option>
            <option value={14} style={{ color: '#000000', backgroundColor: '#ffffff' }}>Next 2 Weeks</option>
          </select>
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Items */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Expiring Items</h3>
          {expiringItems.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">No items expiring soon! Great job!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expiringItems.map(item => (
                <div key={item.inventory_id} className={`p-3 rounded-lg border ${getExpiryColor(item.expiration_date)}`}>
                  <div className="font-semibold text-gray-800">{item.Product?.product_name}</div>
                  <div className="text-sm text-gray-600">
                    Qty: {item.quantity} {item.quantity > 1 ? 'units' : 'unit'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Expires: {new Date(item.expiration_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Recipes */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Suggested Recipes ({suggestedRecipes.length})
          </h3>
          {suggestedRecipes.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">No recipes using expiring items. Create recipes that include these items!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {suggestedRecipes.map(recipe => (
                <div key={recipe.meal_id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="font-semibold text-gray-800">{recipe.meal_name}</div>
                  <button
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setScheduleDate(getTodayDate());
                      setShowScheduleModal(true);
                    }}
                    className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded text-sm transition"
                  >
                    Schedule This Meal
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Schedule "{selectedRecipe.meal_name}"
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={getTodayDate()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {selectedRecipe.Meal_Ingredient && selectedRecipe.Meal_Ingredient.length > 0 && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Ingredients:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {selectedRecipe.Meal_Ingredient.map(ing => (
                    <li key={ing.meal_ing_id}>
                      • {ing.quantity_required} {ing.Product?.unit_type || 'units'} of {ing.Product?.product_name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedRecipe(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleRecipe}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {loading ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
