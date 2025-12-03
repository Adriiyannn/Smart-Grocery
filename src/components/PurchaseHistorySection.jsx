import { useState, useEffect } from 'react';
import { Loader, TrendingUp, ShoppingBag, Calendar } from 'lucide-react';
import { getPurchaseHistory, calculatePurchaseStats } from '../utils/userProfileUtils';

export default function PurchaseHistorySection({ user }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    averagePerPurchase: 0,
    categoryBreakdown: {}
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, month, week

  useEffect(() => {
    const fetchHistory = async () => {
      if (user) {
        const data = await getPurchaseHistory(user.id);
        setHistory(data);
        const calculatedStats = calculatePurchaseStats(data);
        setStats(calculatedStats);
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const getFilteredData = () => {
    const now = new Date();
    return history.filter(item => {
      const itemDate = new Date(item.purchase_date);
      if (filter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      } else if (filter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return itemDate >= monthAgo;
      }
      return true;
    });
  };

  const filteredData = getFilteredData();
  const filteredStats = calculatePurchaseStats(filteredData);

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader className="animate-spin" /></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Purchase History & Analytics</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Spent</p>
              <p className="text-3xl font-bold text-blue-900">₱{filteredStats.totalSpent.toFixed(2)}</p>
            </div>
            <span className="text-4xl text-blue-400 opacity-70 font-bold">₱</span>
          </div>
        </div>

        <div className="bg-linear-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Avg Per Purchase</p>
              <p className="text-3xl font-bold text-green-900">₱{filteredStats.averagePerPurchase.toFixed(2)}</p>
            </div>
            <ShoppingBag className="w-10 h-10 text-green-400 opacity-70" />
          </div>
        </div>

        <div className="bg-linear-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Purchases</p>
              <p className="text-3xl font-bold text-purple-900">{filteredData.length}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-400 opacity-70" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => setFilter('month')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'month'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => setFilter('week')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'week'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          Last 7 Days
        </button>
      </div>

      {/* Category Breakdown */}
      {Object.keys(filteredStats.categoryBreakdown).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
          <div className="space-y-3">
            {Object.entries(filteredStats.categoryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const percentage = (amount / filteredStats.totalSpent) * 100;
                return (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 font-medium">{category}</span>
                      <span className="text-gray-900 font-bold">₱{amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Purchase History Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase History</h3>
        {filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Category</th>
                  <th className="px-4 py-3 text-left text-gray-700 font-semibold">Item</th>
                  <th className="px-4 py-3 text-right text-gray-700 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((purchase, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{purchase.category || 'General'}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{purchase.item_name || 'Item'}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-bold">₱{purchase.amount?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No purchase history yet</p>
            <p className="text-gray-400 text-sm mt-2">Your purchases will appear here as you shop</p>
          </div>
        )}
      </div>

      {/* Insights */}
      {filteredData.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📊 Shopping Insights</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• You've made <strong>{filteredData.length}</strong> purchases {filter === 'week' ? 'this week' : filter === 'month' ? 'this month' : 'total'}</li>
            <li>• Average spending: <strong>₱{filteredStats.averagePerPurchase.toFixed(2)}</strong> per purchase</li>
            {Object.entries(filteredStats.categoryBreakdown).length > 0 && (
              <li>• Top category: <strong>{Object.entries(filteredStats.categoryBreakdown).sort(([, a], [, b]) => b - a)[0][0]}</strong></li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
