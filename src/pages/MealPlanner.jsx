import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import MealCalendar from '../components/MealCalendar';
import RecipeLibrary from '../components/RecipeLibrary';
import MealToGroceryList from '../components/MealToGroceryList';
import ExpiringItemsSuggestions from '../components/ExpiringItemsSuggestions';
import NutritionalInfo from '../components/NutritionalInfo';
import { getUpcomingMeals } from '../utils/mealPlannerUtils';
import { getOrCreateActiveList } from '../utils/groceryListUtils';

export default function MealPlanner() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');
  const [upcomingMeals, setUpcomingMeals] = useState([]);
  const [groceryListId, setGroceryListId] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        await fetchInitialData(session.user.id);
      } else {
        navigate('/');
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (!session?.user) {
          navigate('/');
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const fetchInitialData = async (userId) => {
    try {
      // Fetch upcoming meals
      const meals = await getUpcomingMeals(userId, 30);
      setUpcomingMeals(meals);

      // Get or create active grocery list
      let list = await getOrCreateActiveList(userId);
      if (!list) {
        // Create if doesn't exist
        const { data: newList } = await supabase
          .from('Grocery_List')
          .insert({ user_id: userId, status: 'active' })
          .select()
          .single();
        list = newList;
      }
      setGroceryListId(list?.list_id);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handleMealAdded = async () => {
    if (user) {
      const meals = await getUpcomingMeals(user.id, 30);
      setUpcomingMeals(meals);
    }
  };

  const handleRefresh = async () => {
    if (user) {
      await fetchInitialData(user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading meal planner...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800">Meal Planner</h1>
          </div>

          {/* Navigation Tabs - Mobile Optimized */}
          <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:overflow-x-visible md:mx-0 md:px-0 justify-center md:justify-start">
            {[
              { id: 'calendar', label: '📅 Calendar', labelShort: 'Calendar' },
              { id: 'recipes', label: '👨‍🍳 Recipes', labelShort: 'Recipes' },
              { id: 'grocery', label: '🛒 Grocery', labelShort: 'Grocery' },
              { id: 'suggestions', label: '💡 Expiring', labelShort: 'Expiring' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap shrink-0 text-sm md:text-base ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.labelShort}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-8">
            <MealCalendar userId={user.id} onMealAdded={handleMealAdded} />
            
            {upcomingMeals.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Upcoming Meals</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {upcomingMeals.map(meal => (
                    <div
                      key={meal.meal_id}
                      onClick={() => setSelectedMeal(meal)}
                      className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-3 md:p-4 border border-blue-200 cursor-pointer hover:shadow-lg transition active:shadow-md"
                    >
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base line-clamp-2">{meal.meal_name}</h3>
                      {meal.meal_date && (
                        <p className="text-xs md:text-sm text-gray-600 mt-1">
                          {new Date(meal.meal_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {meal.Meal_Ingredient?.length || 0} ingredients
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedMeal && (
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex-1 pr-2">{selectedMeal.meal_name}</h2>
                  <button
                    onClick={() => setSelectedMeal(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl shrink-0 "
                  >
                    ×
                  </button>
                </div>

                {selectedMeal.meal_date && (
                  <p className="text-sm md:text-base text-gray-600 mb-4">
                    Scheduled for: {new Date(selectedMeal.meal_date).toLocaleDateString()}
                  </p>
                )}

                {selectedMeal.Meal_Ingredient && selectedMeal.Meal_Ingredient.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">Ingredients:</h3>
                    <ul className="space-y-2">
                      {selectedMeal.Meal_Ingredient.map(ing => (
                        <li key={ing.meal_ing_id} className="flex items-start gap-2 text-xs md:text-sm">
                          <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1 "></span>
                          <span>{ing.quantity_required} {ing.Product?.unit_type || 'unit'} of {ing.Product?.product_name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <NutritionalInfo meal={selectedMeal} />
              </div>
            )}
          </div>
        )}

        {/* Recipes Tab */}
        {activeTab === 'recipes' && (
          <RecipeLibrary userId={user.id} onRecipeAdded={handleMealAdded} />
        )}

        {/* Add to Grocery List Tab */}
        {activeTab === 'grocery' && (
          <MealToGroceryList
            meals={upcomingMeals}
            listId={groceryListId}
            onAddedToList={handleRefresh}
          />
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <ExpiringItemsSuggestions userId={user.id} onMealScheduled={handleMealAdded} />
        )}
      </main>
    </div>
  );
}
