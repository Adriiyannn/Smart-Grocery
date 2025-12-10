import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { addRecipe, getAllProducts, getOrCreateProduct, getOrCreateRecipeLibrary } from '../utils/mealPlannerUtils';

export default function RecipeLibrary({ userId, onRecipeAdded }) {
  const [recipes, setRecipes] = useState([]);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [currentIngredient, setCurrentIngredient] = useState({
    name: '',
    quantity: 1,
    unit: 'unit',
  });

  useEffect(() => {
    fetchProducts();
    fetchRecipes();
  }, [userId]);

  const fetchRecipes = async () => {
    try {
      const recipesData = await getOrCreateRecipeLibrary(userId);
      // Filter only recipes without meal_date (these are saved recipes, not scheduled meals)
      const savedRecipes = recipesData.filter(recipe => recipe.meal_date === null);
      setRecipes(savedRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const productsData = await getAllProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addIngredient = async () => {
    if (!currentIngredient.name.trim() || currentIngredient.quantity <= 0) {
      Swal.fire('Error', 'Please enter a valid ingredient name and quantity', 'error');
      return;
    }

    try {
      setLoading(true);
      // Get or create product
      const product = await getOrCreateProduct(
        currentIngredient.name,
        '',
        currentIngredient.unit
      );

      const newIngredient = {
        product_id: product.product_id,
        product_name: product.product_name,
        quantity_required: currentIngredient.quantity,
        unit_type: product.unit_type,
      };

      setIngredients([...ingredients, newIngredient]);
      setCurrentIngredient({ name: '', quantity: 1, unit: 'unit' });
    } catch (error) {
      console.error('Error adding ingredient:', error);
      Swal.fire('Error', 'Failed to add ingredient', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddRecipe = async () => {
    if (!recipeName.trim()) {
      Swal.fire('Error', 'Please enter a recipe name', 'error');
      return;
    }

    if (ingredients.length === 0) {
      Swal.fire('Error', 'Please add at least one ingredient', 'error');
      return;
    }

    try {
      setLoading(true);
      const recipe = await addRecipe(userId, recipeName, ingredients);
      
      // Reset form
      setRecipeName('');
      setIngredients([]);
      setShowAddRecipe(false);
      
      // Refresh recipes list
      await fetchRecipes();
      
      Swal.fire('Success', 'Recipe added to library!', 'success');
      if (onRecipeAdded) onRecipeAdded(recipe);
    } catch (error) {
      console.error('Error adding recipe:', error);
      Swal.fire('Error', 'Failed to add recipe', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Recipe Library</h2>
        <button
          onClick={() => setShowAddRecipe(!showAddRecipe)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          + Add Recipe
        </button>
      </div>

      {showAddRecipe && (
        <>
          {/* Blurred Background Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowAddRecipe(false)}
          ></div>

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">Add New Recipe</h3>
                <button
                  onClick={() => setShowAddRecipe(false)}
                  className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Recipe Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipe Name
                  </label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="e.g., Pasta Carbonara"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                </div>

                {/* Add Ingredients Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Add Ingredients</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      value={currentIngredient.name}
                      onChange={(e) => setCurrentIngredient({ ...currentIngredient, name: e.target.value })}
                      placeholder="Ingredient name"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    />
                    <input
                      type="number"
                      value={currentIngredient.quantity}
                      onChange={(e) => setCurrentIngredient({ ...currentIngredient, quantity: parseFloat(e.target.value) })}
                      placeholder="Quantity"
                      min="0.1"
                      step="0.1"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    />
                    <select
                      value={currentIngredient.unit}
                      onChange={(e) => setCurrentIngredient({ ...currentIngredient, unit: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    >
                      <option value="unit">unit</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="cup">cup</option>
                      <option value="tbsp">tbsp</option>
                      <option value="tsp">tsp</option>
                    </select>
                  </div>

                  <button
                    onClick={addIngredient}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Add Ingredient
                  </button>

                  {ingredients.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">Ingredients Added:</h4>
                      <div className="space-y-2">
                        {ingredients.map((ing, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                            <span className="text-gray-800">{ing.quantity_required} {ing.unit_type} of {ing.product_name}</span>
                            <button
                              onClick={() => removeIngredient(idx)}
                              className="text-red-600 hover:text-red-800 font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3 justify-end">
                <button
                  onClick={() => setShowAddRecipe(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRecipe}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
                >
                  {loading ? 'Saving...' : 'Save Recipe'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {!showAddRecipe && recipes.length === 0 && (
        <p className="text-gray-500 text-center py-8">No recipes yet. Create your first recipe!</p>
      )}

      {!showAddRecipe && recipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <div key={recipe.meal_id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <h3 className="font-bold text-gray-800 mb-2">{recipe.meal_name}</h3>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Ingredients:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-2">
                  {recipe.Meal_Ingredient && recipe.Meal_Ingredient.length > 0 ? (
                    recipe.Meal_Ingredient.map((ing, idx) => (
                      <li key={idx} className="list-disc">
                        {ing.quantity_required} {ing.Product?.unit_type || 'unit'} of {ing.Product?.product_name || 'Unknown'}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 italic">No ingredients</li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
