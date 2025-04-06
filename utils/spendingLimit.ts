/**
 * Utility to check and track daily spending limits
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Transaction {
  amount: number;
  date: string;
  category: string;
  description: string;
}

interface SpendingLimit {
  monthlyLimit: number;
  dailyLimit: number;
  categoryLimits: {
    [key: string]: number;
  };
}

// Default spending limits
const DEFAULT_LIMITS: SpendingLimit = {
  monthlyLimit: 50000, // ₹50,000
  dailyLimit: 10000,  // ₹10,000
  categoryLimits: {
    'shopping': 20000,
    'food': 15000,
    'entertainment': 10000,
    'travel': 25000,
    'utilities': 5000,
    'health': 10000,
    'education': 15000,
    'other': 5000,
  }
};

// Example transactions for the current month
const EXAMPLE_TRANSACTIONS: Transaction[] = [
  {
    amount: 2500,
    date: '2024-04-01',
    category: 'food',
    description: 'Restaurant dinner',
  },
  {
    amount: 1500,
    date: '2024-04-02',
    category: 'shopping',
    description: 'Clothing purchase',
  },
  {
    amount: 3000,
    date: '2024-04-03',
    category: 'travel',
    description: 'Train tickets',
  },
  {
    amount: 2000,
    date: '2024-04-04',
    category: 'entertainment',
    description: 'Movie tickets',
  },
  {
    amount: 5000,
    date: '2024-04-05',
    category: 'health',
    description: 'Medical checkup',
  },
  {
    amount: 10000,
    date: '2024-04-06',
    category: 'education',
    description: 'Online course',
  },
  {
    amount: 2000,
    date: '2024-04-07',
    category: 'utilities',
    description: 'Electricity bill',
  },
  {
    amount: 3000,
    date: '2024-04-08',
    category: 'food',
    description: 'Grocery shopping',
  },
  {
    amount: 5000,
    date: '2024-04-09',
    category: 'shopping',
    description: 'Electronics',
  },
  {
    amount: 4000,
    date: '2024-04-10',
    category: 'travel',
    description: 'Flight tickets',
  },
];

// Calculate total spent in current month
const calculateMonthlySpent = (): number => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return EXAMPLE_TRANSACTIONS.reduce((total, transaction) => {
    const transactionDate = new Date(transaction.date);
    if (transactionDate.getMonth() === currentMonth && 
        transactionDate.getFullYear() === currentYear) {
      return total + transaction.amount;
    }
    return total;
  }, 0);
};

// Calculate total spent today
const calculateDailySpent = (): number => {
  const today = new Date().toISOString().split('T')[0];
  
  return EXAMPLE_TRANSACTIONS.reduce((total, transaction) => {
    if (transaction.date === today) {
      return total + transaction.amount;
    }
    return total;
  }, 0);
};

// Calculate spent in a specific category
const calculateCategorySpent = (category: string): number => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return EXAMPLE_TRANSACTIONS.reduce((total, transaction) => {
    const transactionDate = new Date(transaction.date);
    if (transaction.category === category &&
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear) {
      return total + transaction.amount;
    }
    return total;
  }, 0);
};

export const checkSpendingLimit = async (amount: number, category?: string): Promise<boolean> => {
  const monthlySpent = calculateMonthlySpent();
  const dailySpent = calculateDailySpent();
  
  // Check monthly limit
  if (monthlySpent + amount > DEFAULT_LIMITS.monthlyLimit) {
    return false;
  }
  
  // Check daily limit
  if (dailySpent + amount > DEFAULT_LIMITS.dailyLimit) {
    return false;
  }
  
  // Check category limit if specified
  if (category && DEFAULT_LIMITS.categoryLimits[category]) {
    const categorySpent = calculateCategorySpent(category);
    if (categorySpent + amount > DEFAULT_LIMITS.categoryLimits[category]) {
      return false;
    }
  }
  
  return true;
};

export const getSpendingSummary = () => {
  const monthlySpent = calculateMonthlySpent();
  const dailySpent = calculateDailySpent();
  
  return {
    monthly: {
      spent: monthlySpent,
      limit: DEFAULT_LIMITS.monthlyLimit,
      remaining: DEFAULT_LIMITS.monthlyLimit - monthlySpent,
    },
    daily: {
      spent: dailySpent,
      limit: DEFAULT_LIMITS.dailyLimit,
      remaining: DEFAULT_LIMITS.dailyLimit - dailySpent,
    },
    categories: Object.keys(DEFAULT_LIMITS.categoryLimits).map(category => ({
      category,
      spent: calculateCategorySpent(category),
      limit: DEFAULT_LIMITS.categoryLimits[category],
      remaining: DEFAULT_LIMITS.categoryLimits[category] - calculateCategorySpent(category),
    })),
  };
};