import { useState, useEffect } from 'react';
import { Save, Loader, AlertCircle } from 'lucide-react';
import { getShoppingHabits, upsertShoppingHabits } from '../utils/userProfileUtils';

export default function ShoppingHabitsSection({ user }) {
  const [habits, setHabits] = useState({
    shopping_frequency: 'weekly',
    preferred_stores: [],
    budget_limit: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const storeOptions = ['Robinsons Supermarket', 'Puregold', 'Gaisano Capital', 'Iligan City Public Market', '7-Eleven', 'Mini Stop'];
  const frequencyOptions = ['Weekly', 'Bi-weekly', 'Monthly', 'As needed'];

  useEffect(() => {
    const fetchHabits = async () => {
      if (user) {
        const data = await getShoppingHabits(user.id);
        if (data) {
          setHabits(data);
        }
        setLoading(false);
      }
    };
    fetchHabits();
  }, [user]);

  const handleInputChange = (field, value) => {
    setHabits(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, value) => {
    setHabits(prev => {
      const arr = prev[field] || [];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...arr, value] };
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await upsertShoppingHabits(user.id, habits);
      setMessage('Shopping habits saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving habits:', error);
      setMessage('Error saving preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader className="animate-spin" /></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shopping Habits</h2>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
        }`}>
          <AlertCircle className="w-5 h-5" />
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Shopping Frequency */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-3">Shopping Frequency</label>
          <select
            value={habits.shopping_frequency || 'weekly'}
            onChange={(e) => handleInputChange('shopping_frequency', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            {frequencyOptions.map(freq => (
              <option key={freq} value={freq.toLowerCase()}>{freq}</option>
            ))}
          </select>
        </div>

        {/* Budget Limit */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-3">Budget Limit (Optional)</label>
          <div className="flex items-center">
            <span className="text-gray-700 mr-2">₱</span>
            <input
              type="number"
              value={habits.budget_limit || 0}
              onChange={(e) => handleInputChange('budget_limit', parseFloat(e.target.value))}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            <span className="text-gray-600 ml-2">per visit</span>
          </div>
        </div>

        {/* Preferred Stores */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-3">Preferred Stores</label>
          <p className="text-sm text-gray-600 mb-3">Select all that apply</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {storeOptions.map(store => (
              <button
                key={store}
                onClick={() => handleArrayChange('preferred_stores', store)}
                className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                  habits.preferred_stores?.includes(store)
                    ? 'bg-green-100 border-green-600 text-green-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                }`}
              >
                {store}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {saving ? <Loader className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
