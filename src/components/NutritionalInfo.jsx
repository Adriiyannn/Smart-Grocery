import { useState, useEffect } from 'react';
import { getMealNutritionalInfo } from '../utils/mealPlannerUtils';

export default function NutritionalInfo({ meal }) {
  const [nutritionalData, setNutritionalData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (meal && meal.meal_id) {
      fetchNutritionalInfo();
    }
  }, [meal]);

  const fetchNutritionalInfo = async () => {
    try {
      setLoading(true);
      const data = await getMealNutritionalInfo(meal.meal_id);
      setNutritionalData(data);
    } catch (error) {
      console.error('Error fetching nutritional info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!meal) {
    return null;
  }

  if (loading) {
    return <div className="text-gray-600">Loading nutritional info...</div>;
  }

  if (!nutritionalData) {
    return null;
  }

  return (
    <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
      <h4 className="font-semibold text-gray-800 mb-4">Nutritional Information</h4>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded p-3 text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">{Math.round(nutritionalData.calories)}</div>
          <div className="text-xs text-gray-600">Calories</div>
        </div>

        <div className="bg-white rounded p-3 text-center border border-green-100">
          <div className="text-2xl font-bold text-green-600">{Math.round(nutritionalData.protein)}g</div>
          <div className="text-xs text-gray-600">Protein</div>
        </div>

        <div className="bg-white rounded p-3 text-center border border-yellow-100">
          <div className="text-2xl font-bold text-yellow-600">{Math.round(nutritionalData.carbs)}g</div>
          <div className="text-xs text-gray-600">Carbs</div>
        </div>

        <div className="bg-white rounded p-3 text-center border border-orange-100">
          <div className="text-2xl font-bold text-orange-600">{Math.round(nutritionalData.fat)}g</div>
          <div className="text-xs text-gray-600">Fat</div>
        </div>

        <div className="bg-white rounded p-3 text-center border border-purple-100">
          <div className="text-2xl font-bold text-purple-600">{Math.round(nutritionalData.fiber)}g</div>
          <div className="text-xs text-gray-600">Fiber</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-white rounded border border-blue-100">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> These are estimated values based on ingredient quantities. For accurate nutritional information, please consult a nutrition database or dietitian.
        </p>
      </div>
    </div>
  );
}
