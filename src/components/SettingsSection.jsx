import { useState, useEffect } from 'react';
import { Save, Loader, AlertCircle } from 'lucide-react';
import { getUserSettings, upsertUserSettings } from '../utils/userProfileUtils';

export default function SettingsSection({ user, onThemeChange }) {
  const [settings, setSettings] = useState({
    unit_system: 'imperial',
    date_format: 'MM/DD/YYYY',
    time_format: '12h'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const unitSystems = [
    { value: 'imperial', label: '🇺🇸 Imperial', desc: 'lbs, oz, cups, °F' },
    { value: 'metric', label: '📏 Metric', desc: 'kg, g, ml, °C' }
  ];

  const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
  ];

  const timeFormats = [
    { value: '12h', label: '12-hour (2:30 PM)' },
    { value: '24h', label: '24-hour (14:30)' }
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      if (user) {
        const data = await getUserSettings(user.id);
        if (data) {
          setSettings(data);
        }
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await upsertUserSettings(user.id, settings);
      setMessage('✓ Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('✗ Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-12"><Loader className="animate-spin w-8 h-8 text-red-600" /></div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Customize Your Experience</h2>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          message.includes('✗') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
        }`}>
          <AlertCircle className="w-5 h-5" />
          {message}
        </div>
      )}

      <div className="space-y-8">
        {/* Unit System */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-4">📐 Measurement System</label>
          <div className="grid grid-cols-2 gap-4">
            {unitSystems.map(unit => (
              <label
                key={unit.value}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  settings.unit_system === unit.value
                    ? 'bg-linear-to-br from-purple-100 to-pink-100 border-purple-500 ring-2 ring-purple-300'
                    : 'bg-white border-gray-300 hover:border-purple-400'
                }`}
              >
                <input
                  type="radio"
                  name="unit_system"
                  value={unit.value}
                  checked={settings.unit_system === unit.value}
                  onChange={(e) => handleInputChange('unit_system', e.target.value)}
                  className="hidden"
                />
                <p className="font-semibold text-gray-900">{unit.label}</p>
                <p className="text-xs text-gray-600 mt-1">{unit.desc}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Date Format */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-4">📅 Date Format</label>
          <select
            value={settings.date_format || 'MM/DD/YYYY'}
            onChange={(e) => handleInputChange('date_format', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium transition"
          >
            {dateFormats.map(format => (
              <option key={format.value} value={format.value}>{format.label}</option>
            ))}
          </select>
        </div>

        {/* Time Format */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-4">🕐 Time Format</label>
          <select
            value={settings.time_format || '12h'}
            onChange={(e) => handleInputChange('time_format', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium transition"
          >
            {timeFormats.map(format => (
              <option key={format.value} value={format.value}>{format.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-linear-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg hover:shadow-xl"
        >
          {saving ? <Loader className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
