/**
 * Utility to generate mock financial data for development and testing
 */
import { Transaction, Goal, SpendingLimit } from '../context/FinancialContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, GOAL_CATEGORIES } from './categories';

// Hardcoded mock transactions
export const generateMockTransactions = (): Transaction[] => {
  return [
    // Income transactions
    {
      id: 'txn-1',
      amount: 50000,
      type: 'income',
      category: 'Salary',
      description: 'Monthly salary',
      date: '2024-03-01',
    },
    {
      id: 'txn-2',
      amount: 15000,
      type: 'income',
      category: 'Business',
      description: 'Freelance project',
      date: '2024-03-10',
    },
    {
      id: 'txn-3',
      amount: 5000,
      type: 'income',
      category: 'Investments',
      description: 'Dividend payment',
      date: '2024-03-15',
    },
    {
      id: 'txn-4',
      amount: 3000,
      type: 'income',
      category: 'Other',
      description: 'Gift from family',
      date: '2024-03-20',
    },
    
    // Expense transactions
    {
      id: 'txn-5',
      amount: 8000,
      type: 'expense',
      category: 'Food & Dining',
      description: 'Grocery shopping',
      date: '2024-03-02',
      merchant: 'supermarket@upi'
    },
    {
      id: 'txn-6',
      amount: 2500,
      type: 'expense',
      category: 'Food & Dining',
      description: 'Restaurant dinner',
      date: '2024-03-08',
      merchant: 'restaurant@upi'
    },
    {
      id: 'txn-7',
      amount: 4000,
      type: 'expense',
      category: 'Transportation',
      description: 'Fuel',
      date: '2024-03-03',
      merchant: 'petrol@upi'
    },
    {
      id: 'txn-8',
      amount: 1500,
      type: 'expense',
      category: 'Transportation',
      description: 'Cab fare',
      date: '2024-03-12',
      merchant: 'rideshare@upi'
    },
    {
      id: 'txn-9',
      amount: 3000,
      type: 'expense',
      category: 'Bills & Utilities',
      description: 'Electricity bill',
      date: '2024-03-04',
      merchant: 'utility@upi'
    },
    {
      id: 'txn-10',
      amount: 1200,
      type: 'expense',
      category: 'Bills & Utilities',
      description: 'Internet bill',
      date: '2024-03-18',
      merchant: 'internet@upi'
    },
    {
      id: 'txn-11',
      amount: 5500,
      type: 'expense',
      category: 'Shopping',
      description: 'New clothes',
      date: '2024-03-14',
      merchant: 'clothing@upi'
    },
    {
      id: 'txn-12',
      amount: 2000,
      type: 'expense',
      category: 'Entertainment',
      description: 'Movie tickets',
      date: '2024-03-16',
      merchant: 'cinema@upi'
    },
    {
      id: 'txn-13',
      amount: 1800,
      type: 'expense',
      category: 'Entertainment',
      description: 'Concert tickets',
      date: '2024-03-22',
      merchant: 'ticketing@upi'
    },
    {
      id: 'txn-14',
      amount: 3500,
      type: 'expense',
      category: 'Other',
      description: 'Gift for friend',
      date: '2024-03-25',
      merchant: 'giftshop@upi'
    }
  ];
};

// Hardcoded mock goals
export const generateMockGoals = (): Goal[] => {
  return [
    {
      id: 'goal-1',
      name: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 25000,
      category: 'Emergency Fund',
      deadline: '2024-12-31'
    },
    {
      id: 'goal-2',
      name: 'Home Down Payment',
      targetAmount: 500000,
      currentAmount: 100000,
      category: 'Home',
      deadline: '2025-12-31'
    },
    {
      id: 'goal-3',
      name: 'Credit Card Payoff',
      targetAmount: 50000,
      currentAmount: 20000,
      category: 'Debt Repayment',
      deadline: '2024-06-30'
    },
    {
      id: 'goal-4',
      name: 'Vacation Fund',
      targetAmount: 75000,
      currentAmount: 15000,
      category: 'Savings',
      deadline: '2024-10-31'
    },
    {
      id: 'goal-5',
      name: 'New Laptop',
      targetAmount: 80000,
      currentAmount: 30000,
      category: 'Other',
      deadline: '2024-08-31'
    }
  ];
};

// Hardcoded mock spending limits
export const generateMockSpendingLimits = (): SpendingLimit[] => {
  return [
    {
      id: 'limit-1',
      category: 'Food & Dining',
      amount: 10000,
      period: 'monthly'
    },
    {
      id: 'limit-2',
      category: 'Transportation',
      amount: 5000,
      period: 'monthly'
    },
    {
      id: 'limit-3',
      category: 'Entertainment',
      amount: 3000,
      period: 'monthly'
    },
    {
      id: 'limit-4',
      category: 'Shopping',
      amount: 7000,
      period: 'monthly'
    },
    {
      id: 'limit-5',
      category: 'Bills & Utilities',
      amount: 5000,
      period: 'monthly'
    }
  ];
};

// Hardcoded mock blocked merchants
export const generateMockBlockedMerchants = (): string[] => {
  return [
    'gambling@upi',
    'casino@upi',
    'lottery@upi',
    'betting@upi',
    'liquor@upi'
  ];
};