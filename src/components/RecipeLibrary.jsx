import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { addRecipe, getAllProducts, getOrCreateProduct } from '../utils/mealPlannerUtils';

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
  }, []);

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
      setRecipes([...recipes, recipe]);
      
      // Reset form
      setRecipeName('');
      setIngredients([]);
      setShowAddRecipe(false);
      
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
          {showAddRecipe ? 'Cancel' : '+ Add Recipe'}
        </button>
      </div>

      {showAddRecipe && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Name
              </label>
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="e.g., Pasta Carbonara"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-4">Add Ingredients</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                value={currentIngredient.name}
                onChange={(e) => setCurrentIngredient({ ...currentIngredient, name: e.target.value })}
                placeholder="Ingredient name"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
              <input
                type="number"
                value={currentIngredient.quantity}
                onChange={(e) => setCurrentIngredient({ ...currentIngredient, quantity: parseFloat(e.target.value) })}
                placeholder="Quantity"
                min="0.1"
                step="0.1"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
              <select
                value={currentIngredient.unit}
                onChange={(e) => setCurrentIngredient({ ...currentIngredient, unit: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
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
                    <div key={idx} className="flex justify-between items-center bg-gray-100 p-3 rounded">
                      <span>{ing.quantity_required} {ing.unit_type} of {ing.product_name}</span>
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

          <button
            onClick={handleAddRecipe}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {loading ? 'Saving...' : 'Save Recipe'}
          </button>
        </div>
      )}

      {!showAddRecipe && recipes.length === 0 && (
        <p className="text-gray-500 text-center py-8">No recipes yet. Create your first recipe!</p>
      )}
    </div>
  );
}
