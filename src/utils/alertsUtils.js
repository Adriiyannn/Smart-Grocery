export const generateAlerts = (inventory) => {
  const alertsList = [];

  if (!inventory || inventory.length === 0) return alertsList;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Low stock items - items with quantity < 2
  const lowStockItems = inventory.filter((item) => item.quantity < 2);
  if (lowStockItems.length > 0) {
    alertsList.push({
      type: 'low-stock',
      message: `${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''} running low on stock`,
      color: 'yellow',
      count: lowStockItems.length,
      details: lowStockItems.map(item => item.Product?.product_name || 'Unknown').join(', '),
    });
  }

  // 2. Items expiring within a week (7 days)
  const expiringWeek = inventory.filter((item) => {
    const expDate = new Date(item.expiration_date);
    expDate.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  });

  if (expiringWeek.length > 0) {
    alertsList.push({
      type: 'expiring-soon',
      message: `${expiringWeek.length} item${expiringWeek.length > 1 ? 's' : ''} expiring within a week`,
      color: 'orange',
      count: expiringWeek.length,
      details: expiringWeek.map(item => `${item.Product?.product_name || 'Unknown'} (${new Date(item.expiration_date).toLocaleDateString()})`).join(', '),
    });
  }

  // 3. Already expired items
  const expiredItems = inventory.filter((item) => {
    const expDate = new Date(item.expiration_date);
    expDate.setHours(0, 0, 0, 0);
    return expDate < today;
  });

  if (expiredItems.length > 0) {
    alertsList.push({
      type: 'expired',
      message: `${expiredItems.length} item${expiredItems.length > 1 ? 's' : ''} have expired`,
      color: 'red',
      count: expiredItems.length,
      details: expiredItems.map(item => item.Product?.product_name || 'Unknown').join(', '),
    });
  }

  return alertsList;
};
