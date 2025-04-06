/**
 * Predefined categories for transactions and financial goals
 */

// Transaction categories
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Bills & Utilities',
  'Shopping',
  'Entertainment',
  'Other'
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Business',
  'Investments',
  'Other'
];

// Goal categories
export const GOAL_CATEGORIES = [
  'Savings',
  'Emergency Fund',
  'Home',
  'Debt Repayment',
  'Other'
];

// Default category icons (can be used with Ionicons)
export const CATEGORY_ICONS: Record<string, string> = {
  // Expense categories
  'Food & Dining': 'restaurant',
  'Transportation': 'car',
  'Bills & Utilities': 'receipt',
  'Health & Medical': 'medical',
  'Housing': 'home',
  
  // Income categories
  'Salary': 'cash',
  'Business': 'business',
  'Investments': 'trending-up',
  
  // Goal categories
  'Savings': 'save',
  'Emergency Fund': 'medkit',
  'Home': 'home',
  'Debt Repayment': 'trending-down',
  
  // Default
  'Other': 'ellipsis-horizontal'
};

// Get all categories combined
export const getAllCategories = () => {
  return [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...GOAL_CATEGORIES])];
};

// Get icon for a category
export const getCategoryIcon = (category: string): string => {
  return CATEGORY_ICONS[category] || 'ellipsis-horizontal';
};