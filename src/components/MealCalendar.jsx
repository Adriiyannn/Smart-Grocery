import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  getMealsForWeek,
  scheduleMeal,
  updateMealDate,
  deleteMeal,
  getOrCreateProduct,
} from '../utils/mealPlannerUtils';

export default function MealCalendar({ userId, onMealAdded }) {
  const [meals, setMeals] = useState({});
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [mealForm, setMealForm] = useState({
    mealName: '',
    ingredients: [],
  });
  const [currentIngredient, setCurrentIngredient] = useState({
    name: '',
    quantity: 1,
  });

  useEffect(() => {
    fetchWeekMeals();
  }, [currentWeekStart, userId]);

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const fetchWeekMeals = async () => {
    try {
      setLoading(true);
      const weekMeals = await getMealsForWeek(userId, currentWeekStart);
      
      const mealsByDate = {};
      weekMeals.forEach(meal => {
        const dateKey = meal.meal_date;
        if (!mealsByDate[dateKey]) {
          mealsByDate[dateKey] = [];
        }
        mealsByDate[dateKey].push(meal);
      });

      setMeals(mealsByDate);
    } catch (error) {
      console.error('Error fetching meals:', error);
      Swal.fire('Error', 'Failed to fetch meals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDaysOfWeek = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const addIngredient = async () => {
    if (!currentIngredient.name.trim() || currentIngredient.quantity <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter a valid ingredient',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      return;
    }

    try {
      const product = await getOrCreateProduct(currentIngredient.name);
      
      setMealForm({
        ...mealForm,
        ingredients: [
          ...mealForm.ingredients,
          {
            product_id: product.product_id,
            product_name: product.product_name,
            quantity_required: currentIngredient.quantity,
          },
        ],
      });

      setCurrentIngredient({ name: '', quantity: 1 });
    } catch (error) {
      console.error('Error adding ingredient:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add ingredient',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
    }
  };

  const handleScheduleMeal = async () => {
    if (!mealForm.mealName.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter a meal name',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      return;
    }

    if (mealForm.ingredients.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please add at least one ingredient',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      return;
    }

    try {
      setLoading(true);
      const meal = await scheduleMeal(
        userId,
        mealForm.mealName,
        formatDate(selectedDate),
        mealForm.ingredients
      );

      const dateKey = formatDate(selectedDate);
      setMeals({
        ...meals,
        [dateKey]: [...(meals[dateKey] || []), meal],
      });

      setShowScheduleModal(false);
      setMealForm({ mealName: '', ingredients: [] });
      setSelectedDate(null);

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Meal scheduled!',
        position: 'center',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      if (onMealAdded) onMealAdded(meal);
    } catch (error) {
      console.error('Error scheduling meal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to schedule meal',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async (mealId, dateKey) => {
    const confirm = await Swal.fire({
      title: 'Delete Meal?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      position: 'center',
      allowOutsideClick: false,
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      await deleteMeal(mealId);
      
      setMeals({
        ...meals,
        [dateKey]: meals[dateKey].filter(m => m.meal_id !== mealId),
      });

      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Meal has been removed',
        position: 'center',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
    } catch (error) {
      console.error('Error deleting meal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete meal',
        position: 'center',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = getDaysOfWeek();
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="bg-linear-to-br from-blue-50 via-cyan-50 to-indigo-50 rounded-2xl shadow-lg p-4 md:p-8 border border-blue-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">📅 Weekly Meal Calendar</h2>
          <p className="text-sm md:text-base text-blue-600 font-semibold">
            {formatDateDisplay(daysOfWeek[0])} - {formatDateDisplay(daysOfWeek[6])}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              const newStart = new Date(currentWeekStart);
              newStart.setDate(newStart.getDate() - 7);
              setCurrentWeekStart(newStart);
            }}
            className="flex-1 md:flex-initial bg-white hover:bg-blue-100 text-blue-600 font-bold py-2 px-3 md:px-4 rounded-lg transition border border-blue-300 text-sm md:text-base"
          >
            ← Previous
          </button>
          <button
            onClick={() => {
              const newStart = new Date(currentWeekStart);
              newStart.setDate(newStart.getDate() + 7);
              setCurrentWeekStart(newStart);
            }}
            className="flex-1 md:flex-initial bg-white hover:bg-blue-100 text-blue-600 font-bold py-2 px-3 md:px-4 rounded-lg transition border border-blue-300 text-sm md:text-base"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-2 md:gap-4 mb-6">
        {daysOfWeek.map((day, idx) => {
          const dateKey = formatDate(day);
          const dayMeals = meals[dateKey] || [];
          const isToday = formatDate(new Date()) === dateKey;

          return (
            <div 
              key={idx} 
              className={`rounded-xl p-3 md:p-5 transition transform hover:scale-105 ${
                isToday 
                  ? 'bg-linear-to-br from-blue-200 to-cyan-200 border-2 border-blue-400 shadow-lg' 
                  : 'bg-white border-2 border-blue-200 shadow-md hover:shadow-lg'
              }`}
            >
              <div className="text-center mb-3 md:mb-4">
                <h3 className="font-bold text-gray-800 text-sm md:text-lg">
                  {weekDays[idx].substring(0, 3)}
                </h3>
                <p className={`text-xl md:text-2xl font-bold ${
                  isToday ? 'text-blue-700' : 'text-blue-600'
                }`}>
                  {day.getDate()}
                </p>
                {isToday && <span className="text-xs font-semibold text-blue-700">TODAY</span>}
              </div>

              <div className="space-y-1 md:space-y-2 mb-3 md:mb-4 min-h-20 md:min-h-24">
                {dayMeals.length === 0 ? (
                  <p className="text-center text-gray-400 text-xs md:text-sm py-3 md:py-4">No meals scheduled</p>
                ) : (
                  dayMeals.map(meal => (
                    <div 
                      key={meal.meal_id} 
                      className="bg-linear-to-r from-blue-100 to-cyan-100 border border-blue-300 rounded-lg p-2 md:p-3 hover:shadow-md transition"
                    >
                      <p className="text-xs md:text-sm font-bold text-gray-800 truncate">🍽️ {meal.meal_name}</p>
                      <p className="text-xs text-gray-600 mt-0.5 md:mt-1">
                        {meal.Meal_Ingredient?.length || 0} items
                      </p>
                      <button
                        onClick={() => handleDeleteMeal(meal.meal_id, dateKey)}
                        className="text-xs text-red-600 hover:text-red-800 hover:font-semibold mt-1 md:mt-2 transition"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedDate(day);
                  setShowScheduleModal(true);
                }}
                className="w-full bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2 px-3 rounded-lg text-xs md:text-sm transition shadow-md"
              >
                + Add Meal
              </button>
            </div>
          );
        })}
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-8 w-full mx-4 md:max-w-md max-h-[90vh] overflow-y-auto border-t-4 border-blue-500">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              🍴 Schedule Meal
            </h3>
            <p className="text-sm md:text-base text-blue-600 font-semibold mb-6">
              {formatDateDisplay(selectedDate)}
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Meal Name</label>
                <input
                  type="text"
                  value={mealForm.mealName}
                  onChange={(e) => setMealForm({ ...mealForm, mealName: e.target.value })}
                  placeholder="e.g., Pasta Carbonara"
                  className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="bg-linear-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4 md:p-5">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm md:text-base">🥘 Ingredients</h4>

                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    value={currentIngredient.name}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, name: e.target.value })}
                    placeholder="Ingredient name"
                    className="w-full px-3 md:px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="number"
                    value={currentIngredient.quantity}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, quantity: parseFloat(e.target.value) })}
                    placeholder="Quantity"
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 md:px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <button
                  onClick={addIngredient}
                  className="w-full bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition mb-4 text-sm"
                >
                  + Add Ingredient
                </button>

                {mealForm.ingredients.length > 0 && (
                  <div className="mt-4 pt-4 border-t-2 border-blue-300 space-y-2">
                    {mealForm.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white rounded-lg p-2 border border-blue-200">
                        <span className="text-xs md:text-sm font-medium text-gray-700">{ing.quantity_required}x {ing.product_name}</span>
                        <button
                          onClick={() => setMealForm({
                            ...mealForm,
                            ingredients: mealForm.ingredients.filter((_, i) => i !== idx)
                          })}
                          className="text-red-500 hover:text-red-700 font-bold hover:bg-red-50 rounded px-2 py-1 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 md:gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setMealForm({ mealName: '', ingredients: [] });
                    setSelectedDate(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 md:py-3 px-3 md:px-4 rounded-lg transition text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleMeal}
                  disabled={loading}
                  className="flex-1 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:bg-gray-400 text-white font-bold py-2 md:py-3 px-3 md:px-4 rounded-lg transition shadow-lg text-sm md:text-base"
                >
                  {loading ? 'Saving...' : '✓ Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
