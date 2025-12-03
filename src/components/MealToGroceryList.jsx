import { useState } from 'react';
import Swal from 'sweetalert2';
import { addMealIngredientsToGroceryList } from '../utils/mealPlannerUtils';

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
    accent-color: #2563eb;
  }
  
  input[type="checkbox"]:checked {
    background-color: #2563eb !important;
    border-color: #2563eb !important;
    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 20 20' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' fill='white'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100% 100%;
  }
`;

export default function MealToGroceryList({ meals, listId, onAddedToList }) {
  const [loading, setLoading] = useState(false);
  const [selectedMeals, setSelectedMeals] = useState([]);

  const handleToggleMeal = (mealId) => {
    if (selectedMeals.includes(mealId)) {
      setSelectedMeals(selectedMeals.filter(id => id !== mealId));
    } else {
      setSelectedMeals([...selectedMeals, mealId]);
    }
  };

  const handleAddToGroceryList = async () => {
    if (selectedMeals.length === 0) {
      Swal.fire('Info', 'Please select at least one meal', 'info');
      return;
    }

    if (!listId) {
      Swal.fire('Error', 'Grocery list not found', 'error');
      return;
    }

    try {
      setLoading(true);
      let totalAdded = 0;
      let totalUpdated = 0;

      for (const mealId of selectedMeals) {
        const result = await addMealIngredientsToGroceryList(listId, mealId);
        totalAdded += result.inserted;
        totalUpdated += result.updated;
      }

      setSelectedMeals([]);
      Swal.fire(
        'Success',
        `Added ${totalAdded} new items and updated ${totalUpdated} existing items in your grocery list!`,
        'success'
      );

      if (onAddedToList) {
        onAddedToList();
      }
    } catch (error) {
      console.error('Error adding meals to grocery list:', error);
      Swal.fire('Error', 'Failed to add meals to grocery list', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!meals || meals.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">No meals scheduled to add to grocery list.</p>
      </div>
    );
  }

  return (
    <>
      <style>{checkboxStyles}</style>
      <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Add Meals to Grocery List</h2>

      <div className="space-y-3 mb-6">
        {meals.map(meal => (
          <div key={meal.meal_id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id={`meal-${meal.meal_id}`}
              checked={selectedMeals.includes(meal.meal_id)}
              onChange={() => handleToggleMeal(meal.meal_id)}
              className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor={`meal-${meal.meal_id}`} className="flex-1 cursor-pointer">
              <div className="font-semibold text-gray-800">{meal.meal_name}</div>
              <div className="text-sm text-gray-600">
                {meal.meal_date && `${new Date(meal.meal_date).toLocaleDateString()}`}
              </div>
              {meal.Meal_Ingredient && meal.Meal_Ingredient.length > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  Ingredients: {meal.Meal_Ingredient.map(ing => ing.Product?.product_name || 'Unknown').join(', ')}
                </div>
              )}
            </label>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddToGroceryList}
        disabled={loading || selectedMeals.length === 0}
        className={`w-full font-semibold py-3 px-4 rounded-lg transition ${
          loading || selectedMeals.length === 0
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {loading ? 'Adding to List...' : `Add ${selectedMeals.length} Meal${selectedMeals.length !== 1 ? 's' : ''} to Grocery List`}
      </button>

      {selectedMeals.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>{selectedMeals.length}</strong> meal{selectedMeals.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
      </div>
    </>
  );
}
