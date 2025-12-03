import { useState, useEffect } from 'react';
import { Save, Loader, AlertCircle, Check } from 'lucide-react';
import { getUserDietaryPreferences, upsertDietaryPreferences } from '../utils/userProfileUtils';

export default function DietaryPreferencesSection({ user }) {
  const [preferences, setPreferences] = useState({
    diet_type: '',
    allergies: [],
    intolerances: [],
    restrictions: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const dietTypes = [
    { name: 'Omnivore', emoji: '🍖' },
    { name: 'Vegetarian', emoji: '🥬' },
    { name: 'Vegan', emoji: '🌱' },
    { name: 'Pescatarian', emoji: '🐟' },
    { name: 'Keto', emoji: '🥓' },
    { name: 'Gluten-Free', emoji: '🌾' }
  ];
  
  const allergyOptions = ['🥜 Peanuts', '🌰 Tree Nuts', '🥛 Dairy', '🥚 Eggs', '🐟 Fish', '🦐 Shellfish', '🫘 Soy', '🌾 Wheat'];
  const intoleranceOptions = ['🥛 Lactose', '🌾 Gluten', '🍯 Fructose', '🧂 Histamine', '🧪 Sulphites'];
  const restrictionOptions = ['🕌 Halal', '✡️ Kosher', '🚫 No Red Meat', '🐷 No Pork', '🧂 Low Sodium', '🍬 Low Sugar'];

  useEffect(() => {
    const fetchPreferences = async () => {
      if (user) {
        const data = await getUserDietaryPreferences(user.id);
        if (data) {
          setPreferences(data);
        }
        setLoading(false);
      }
    };
    fetchPreferences();
  }, [user]);

  const handleDietTypeChange = (type) => {
    setPreferences(prev => ({
      ...prev,
      diet_type: prev.diet_type === type ? '' : type
    }));
  };

  const handleArrayChange = (field, value) => {
    setPreferences(prev => {
      const arr = prev[field] || [];
      const cleanValue = value.split(' ').slice(1).join(' ');
      if (arr.includes(cleanValue)) {
        return { ...prev, [field]: arr.filter(item => item !== cleanValue) };
      } else {
        return { ...prev, [field]: [...arr, cleanValue] };
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await upsertDietaryPreferences(user.id, preferences);
      setMessage('✓ Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('✗ Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-12"><Loader className="animate-spin w-8 h-8 text-green-600" /></div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Dietary Preferences</h2>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          message.includes('✗') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
        }`}>
          <AlertCircle className="w-5 h-5" />
          {message}
        </div>
      )}

      <div className="space-y-8">
        {/* Diet Type */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-4">🍽️ What's Your Diet Type?</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {dietTypes.map(({ name, emoji }) => (
              <button
                key={name}
                onClick={() => handleDietTypeChange(name)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  preferences.diet_type === name
                    ? 'bg-green-100 border-green-500 ring-2 ring-green-300'
                    : 'bg-white border-gray-300 hover:border-green-400'
                }`}
              >
                <div className="text-2xl mb-2">{emoji}</div>
                <p className="font-semibold text-sm text-gray-900">{name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-4">⚠️ Allergies</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allergyOptions.map(allergy => {
              const cleanValue = allergy.split(' ').slice(1).join(' ');
              return (
                <button
                  key={allergy}
                  onClick={() => handleArrayChange('allergies', allergy)}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    preferences.allergies?.includes(cleanValue)
                      ? 'bg-red-100 border-red-500 ring-2 ring-red-300'
                      : 'bg-white border-gray-300 hover:border-red-400'
                  }`}
                >
                  {preferences.allergies?.includes(cleanValue) && <Check className="w-4 h-4" />}
                  <span className="text-sm font-semibold text-gray-900">{allergy}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Intolerances */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-4">🤢 Intolerances</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {intoleranceOptions.map(intolerance => {
              const cleanValue = intolerance.split(' ').slice(1).join(' ');
              return (
                <button
                  key={intolerance}
                  onClick={() => handleArrayChange('intolerances', intolerance)}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    preferences.intolerances?.includes(cleanValue)
                      ? 'bg-orange-100 border-orange-500 ring-2 ring-orange-300'
                      : 'bg-white border-gray-300 hover:border-orange-400'
                  }`}
                >
                  {preferences.intolerances?.includes(cleanValue) && <Check className="w-4 h-4" />}
                  <span className="text-sm font-semibold text-gray-900">{intolerance}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Restrictions */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-4">📋 Other Restrictions</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {restrictionOptions.map(restriction => {
              const cleanValue = restriction.split(' ').slice(1).join(' ');
              return (
                <button
                  key={restriction}
                  onClick={() => handleArrayChange('restrictions', restriction)}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    preferences.restrictions?.includes(cleanValue)
                      ? 'bg-purple-100 border-purple-500 ring-2 ring-purple-300'
                      : 'bg-white border-gray-300 hover:border-purple-400'
                  }`}
                >
                  {preferences.restrictions?.includes(cleanValue) && <Check className="w-4 h-4" />}
                  <span className="text-sm font-semibold text-gray-900">{restriction}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg hover:shadow-xl"
        >
          {saving ? <Loader className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
