import supabase from './supabase';

// ==================== USER PREFERENCES TABLE OPS ====================

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) console.error('Error fetching user profile:', error);
  return data;
};

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('User')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) console.error('Error updating user profile:', error);
  return data;
};

// ==================== DIETARY PREFERENCES ====================

export const getUserDietaryPreferences = async (userId) => {
  const { data, error } = await supabase
    .from('User_Dietary_Preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') console.error('Error fetching dietary preferences:', error);
  return data;
};

export const upsertDietaryPreferences = async (userId, preferences) => {
  const { data, error } = await supabase
    .from('User_Dietary_Preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date()
    }, { onConflict: 'user_id' })
    .select()
    .single();
  
  if (error) console.error('Error upserting dietary preferences:', error);
  return data;
};

// ==================== SHOPPING HABITS & NOTIFICATIONS ====================

export const getShoppingHabits = async (userId) => {
  const { data, error } = await supabase
    .from('User_Shopping_Habits')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') console.error('Error fetching shopping habits:', error);
  return data;
};

export const upsertShoppingHabits = async (userId, habits) => {
  const { data, error } = await supabase
    .from('User_Shopping_Habits')
    .upsert({
      user_id: userId,
      ...habits,
      updated_at: new Date()
    }, { onConflict: 'user_id' })
    .select()
    .single();
  
  if (error) console.error('Error upserting shopping habits:', error);
  return data;
};

// ==================== PURCHASE HISTORY & ANALYTICS ====================

export const getPurchaseHistory = async (userId, limit = 50) => {
  const { data, error } = await supabase
    .from('User_Purchase_History')
    .select('*')
    .eq('user_id', userId)
    .order('purchase_date', { ascending: false })
    .limit(limit);
  
  if (error) console.error('Error fetching purchase history:', error);
  return data || [];
};

export const addPurchaseHistory = async (userId, purchaseData) => {
  const { data, error } = await supabase
    .from('User_Purchase_History')
    .insert({
      user_id: userId,
      ...purchaseData,
      purchase_date: new Date()
    })
    .select()
    .single();
  
  if (error) console.error('Error adding purchase history:', error);
  return data;
};

export const getPurchaseAnalytics = async (userId) => {
  const { data, error } = await supabase
    .from('User_Purchase_History')
    .select('category, amount, purchase_date')
    .eq('user_id', userId)
    .order('purchase_date', { ascending: false })
    .limit(100);
  
  if (error) console.error('Error fetching purchase analytics:', error);
  return data || [];
};

// ==================== USER SETTINGS (THEME & LANGUAGE) ====================

export const getUserSettings = async (userId) => {
  const { data, error } = await supabase
    .from('User_Settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') console.error('Error fetching user settings:', error);
  return data;
};

export const upsertUserSettings = async (userId, settings) => {
  const { data, error } = await supabase
    .from('User_Settings')
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date()
    }, { onConflict: 'user_id' })
    .select()
    .single();
  
  if (error) console.error('Error upserting user settings:', error);
  return data;
};

// ==================== HELPER FUNCTIONS ====================

export const calculatePurchaseStats = (purchaseHistory) => {
  if (!purchaseHistory || purchaseHistory.length === 0) {
    return { totalSpent: 0, averagePerPurchase: 0, categoryBreakdown: {} };
  }

  const totalSpent = purchaseHistory.reduce((sum, p) => sum + (p.amount || 0), 0);
  const averagePerPurchase = totalSpent / purchaseHistory.length;

  const categoryBreakdown = purchaseHistory.reduce((acc, p) => {
    const cat = p.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (p.amount || 0);
    return acc;
  }, {});

  return { totalSpent, averagePerPurchase, categoryBreakdown };
};
