import { useState, useEffect } from 'react';
import { User, Mail } from 'lucide-react';
import { getUserProfile } from '../utils/userProfileUtils';
import UserInfoSection from '../components/UserInfoSection';
import supabase from '../utils/supabase';
import { generateAlerts } from '../utils/alertsUtils';

export default function Profile({ user, onThemeChange, onAlertsUpdate }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (user) {
        const profile = await getUserProfile(user.id);
        setUserInfo(profile);
        await fetchAlerts(user.id);
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, [user]);

  const fetchAlerts = async (userId) => {
    try {
      // Fetch inventory to check for expiring items
      const { data: inventory, error: inventoryError } = await supabase
        .from('Inventory')
        .select('*, Product(product_id, product_name, category)')
        .eq('user_id', userId);

      if (inventoryError) throw inventoryError;

      const validInventory = inventory?.filter(item => item && item.inventory_id) || [];
      const alerts = generateAlerts(validInventory);

      if (onAlertsUpdate) {
        onAlertsUpdate(alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Avatar */}
      <div className="relative bg-linear-to-r from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white opacity-5 rounded-full -ml-36 -mb-36"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-linear-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white ring-opacity-20">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 rounded-full border-4 border-white"></div>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{userInfo?.name || 'Welcome back!'}</h1>
              <div className="flex items-center gap-2 text-blue-100">
                <Mail className="w-4 h-4" />
                <p className="text-sm">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area - Personal Information Only */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <UserInfoSection user={user} />
      </div>
    </div>
  );
}
