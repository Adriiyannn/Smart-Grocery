import { useState } from 'react';
import { Menu, X, Home, ShoppingCart, UtensilsCrossed, Package, User, Bell, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout, alerts = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Grocery List', icon: ShoppingCart, path: '/grocery-list' },
    { name: 'Meal Planner', icon: UtensilsCrossed, path: '/meal-planner' },
    { name: 'Inventory', icon: Package, path: '/inventory' },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setIsOpen(false);
    setShowProfileMenu(false);
  };

  const handleLogoutClick = async () => {
    await onLogout();
    setShowProfileMenu(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-md sticky top-0 z-40 border-b border-gray-200">
        <div className="flex justify-between items-center h-14 px-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-blue-600 rounded-lg p-1.5">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">SmartGrocery</span>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="flex items-center justify-center relative p-2 rounded-lg hover:bg-blue-100 transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-5 h-5 ">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* Mobile Notification Dropdown */}
              {showNotifications && alerts.length > 0 && (
                <div className="absolute right-0 mt-2 w-64 sm:w-72 md:w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                  <div className="p-3 border-b border-gray-200 bg-blue-50">
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <span>🔔</span>
                      Alerts ({alerts.length})
                    </h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className={`p-3 border-b border-gray-100 last:border-b-0 flex items-center gap-2 ${
                          alert.color === 'red'
                            ? 'bg-red-50'
                            : alert.color === 'orange'
                            ? 'bg-yellow-50'
                            : alert.color === 'blue'
                            ? 'bg-blue-50'
                            : 'bg-yellow-50'
                        }`}
                      >
                        <span className="text-lg shrink-0 ">
                          {alert.color === 'red' ? '🚨' : alert.color === 'orange' ? '⚠️' : alert.color === 'blue' ? 'ℹ️' : '⚡'}
                        </span>
                        <p className={`text-xs font-semibold ${
                          alert.color === 'red'
                            ? 'text-red-800'
                            : alert.color === 'orange'
                            ? 'text-yellow-800'
                            : alert.color === 'blue'
                            ? 'text-blue-800'
                            : 'text-yellow-800'
                        }`}>
                          {alert.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="relative p-2 rounded-full hover:opacity-80 transition"
                title="Profile"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-white">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border border-white"></div>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div
                    onClick={() => handleNavClick('/profile')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-200 flex items-center gap-2 text-gray-700 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </div>
                  <div
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 transition flex items-center gap-2 text-red-600 font-semibold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navbar - Top */}
      <nav className="hidden md:block bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-blue-600 rounded-lg p-2">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">SmartGrocery</span>
            </div>

            {/* Desktop Navigation */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Right side - Notifications and Profile */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center justify-center relative p-2 rounded-lg hover:bg-blue-100 transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-700" />
                  {alerts.length > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-6 h-6 ">
                      {alerts.length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && alerts.length > 0 && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                    <div className="p-4 border-b border-gray-200 bg-blue-50">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-lg">🔔</span>
                        Alerts ({alerts.length})
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className={`p-4 border-b border-gray-100 last:border-b-0 flex items-center gap-3 ${
                            alert.color === 'red'
                              ? 'bg-red-50'
                              : alert.color === 'orange'
                              ? 'bg-yellow-50'
                              : alert.color === 'blue'
                              ? 'bg-blue-50'
                              : 'bg-yellow-50'
                          }`}
                        >
                          <span className="text-lg shrink-0 ">
                            {alert.color === 'red' ? '🚨' : alert.color === 'orange' ? '⚠️' : alert.color === 'blue' ? 'ℹ️' : '⚡'}
                          </span>
                          <p className={`text-sm font-semibold ${
                            alert.color === 'red'
                              ? 'text-red-800'
                              : alert.color === 'orange'
                              ? 'text-yellow-800'
                              : alert.color === 'blue'
                              ? 'text-blue-800'
                              : 'text-yellow-800'
                          }`}>
                            {alert.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  className="relative p-2 rounded-full hover:opacity-80 transition"
                  title="Profile"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-white">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div
                    onClick={() => handleNavClick('/profile')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-200 flex items-center gap-2 text-gray-700 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </div>
                  <div
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 transition flex items-center gap-2 text-red-600 font-semibold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar - Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.path)}
                className={`flex items-center justify-center p-3 rounded-lg transition duration-200 ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
                title={item.name}
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
