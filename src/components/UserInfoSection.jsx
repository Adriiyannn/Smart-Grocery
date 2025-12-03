import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Save, Loader, Edit2, X } from 'lucide-react';
import { updateUserProfile, getUserProfile } from '../utils/userProfileUtils';

export default function UserInfoSection({ user }) {
  const [userInfo, setUserInfo] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (user) {
        const profile = await getUserProfile(user.id);
        setUserInfo(profile);
        setFormData(profile || {});
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateUserProfile(user.id, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        country: formData.country
      });
      setUserInfo(updated);
      setEditMode(false);
    } catch (error) {
      console.error('Error saving user info:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-12"><Loader className="animate-spin w-8 h-8 text-blue-600" /></div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Personal Information</h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm md:text-base ${
            editMode
              ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {editMode ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          {editMode ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Email Card */}
        <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-4 md:p-6 rounded-xl border border-blue-100">
          <label className="block text-xs md:text-sm font-semibold text-blue-900 mb-2">Email Address</label>
          <div className="flex items-center gap-3">
            <Mail className="w-4 md:w-5 h-4 md:h-5 text-blue-600 shrink-0" />
            <span className="text-sm md:text-lg text-gray-900 break-all">{user?.email}</span>
          </div>
          <p className="text-xs text-blue-600 mt-2">Verified • Cannot be changed</p>
        </div>

        {/* Name Field */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Full Name</label>
          {editMode ? (
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-sm md:text-base"
              placeholder="Enter your full name"
            />
          ) : (
            <p className="px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-xl text-gray-900 font-medium text-sm md:text-base">
              {userInfo?.name || '—'}
            </p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
          {editMode ? (
            <div className="flex items-center gap-2">
              <Phone className="w-4 md:w-5 h-4 md:h-5 text-gray-400 shrink-0" />
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                className="flex-1 px-3 md:px-4 py-2 md:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-sm md:text-base"
                placeholder="Enter your phone number"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-xl">
              <Phone className="w-4 md:w-5 h-4 md:h-5 text-gray-400 shrink-0" />
              <span className="text-gray-900 font-medium text-sm md:text-base">{userInfo?.phone || '—'}</span>
            </div>
          )}
        </div>

        {/* Address Field */}
        <div>
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Address</label>
          {editMode ? (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 md:w-5 h-4 md:h-5 text-gray-400 mt-2 md:mt-3 shrink-0" />
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                className="flex-1 px-3 md:px-4 py-2 md:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-sm md:text-base"
                placeholder="Enter your address"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-xl">
              <MapPin className="w-4 md:w-5 h-4 md:h-5 text-gray-400 shrink-0" />
              <span className="text-gray-900 font-medium text-sm md:text-base">{userInfo?.address || '—'}</span>
            </div>
          )}
        </div>

        {/* City, Postal Code, Country */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">City</label>
            {editMode ? (
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleInputChange}
                className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-sm md:text-base"
                placeholder="City"
              />
            ) : (
              <p className="px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-xl text-gray-900 font-medium text-sm md:text-base">{userInfo?.city || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
            {editMode ? (
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code || ''}
                onChange={handleInputChange}
                className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-sm md:text-base"
                placeholder="Postal Code"
              />
            ) : (
              <p className="px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-xl text-gray-900 font-medium text-sm md:text-base">{userInfo?.postal_code || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Country</label>
            {editMode ? (
              <input
                type="text"
                name="country"
                value={formData.country || ''}
                onChange={handleInputChange}
                className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-sm md:text-base"
                placeholder="Country"
              />
            ) : (
              <p className="px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-xl text-gray-900 font-medium text-sm md:text-base">{userInfo?.country || '—'}</p>
            )}
          </div>
        </div>

        {editMode && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 md:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg hover:shadow-xl text-sm md:text-base"
          >
            {saving ? <Loader className="animate-spin w-4 md:w-5 h-4 md:h-5" /> : <Save className="w-4 md:w-5 h-4 md:h-5" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  );
}
