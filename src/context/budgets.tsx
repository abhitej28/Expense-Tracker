import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

export type BudgetSettings = {
  monthlyLimit: number;
  categoryLimits: Record<string, number>;
};

type BudgetContextValue = {
  budgets: BudgetSettings;
  setMonthlyLimit: (amount: number) => void;
  setCategoryLimit: (category: string, amount: number | null) => void;
};

const STORAGE_KEY = '@pennywise/budgets-v1';
const DEFAULT_BUDGETS: BudgetSettings = {
  monthlyLimit: 15000,
  categoryLimits: {},
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

function parseBudgetSettings(value: unknown): BudgetSettings | null {
  if (typeof value !== 'object' || value === null) return null;

  const candidate = value as Record<string, unknown>;
  const monthlyLimit = candidate.monthlyLimit;
  const rawCategoryLimits = candidate.categoryLimits;

  if (typeof monthlyLimit !== 'number' || !Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
    return null;
  }

  const categoryLimits: Record<string, number> = {};
  if (typeof rawCategoryLimits === 'object' && rawCategoryLimits !== null) {
    for (const [category, amount] of Object.entries(rawCategoryLimits)) {
      if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
        categoryLimits[category] = amount;
      }
    }
  }

  return { monthlyLimit, categoryLimits };
}

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const [budgets, setBudgets] = useState<BudgetSettings>(DEFAULT_BUDGETS);
  const [isLoaded, setIsLoaded] = useState(false);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isMounted = true;

    async function loadBudgets() {
      try {
        const savedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (!savedValue || !isMounted) return;

        const parsed: unknown = JSON.parse(savedValue);
        const valid = parseBudgetSettings(parsed);
        if (valid) setBudgets(valid);
      } catch (error) {
        console.warn('Could not load saved budgets.', error);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    }

    void loadBudgets();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const snapshot = JSON.stringify(budgets);
    writeQueue.current = writeQueue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(STORAGE_KEY, snapshot))
      .catch((error: unknown) => {
        console.warn('Could not save budgets on this device.', error);
      });
  }, [budgets, isLoaded]);

  const setMonthlyLimit = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    setBudgets((previous) => ({ ...previous, monthlyLimit: amount }));
  };

  const setCategoryLimit = (category: string, amount: number | null) => {
    setBudgets((previous) => {
      const categoryLimits = { ...previous.categoryLimits };
      if (amount === null || !Number.isFinite(amount) || amount <= 0) {
        delete categoryLimits[category];
      } else {
        categoryLimits[category] = amount;
      }
      return { ...previous, categoryLimits };
    });
  };

  return (
    <BudgetContext.Provider value={{ budgets, setMonthlyLimit, setCategoryLimit }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudgets() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgets must be used inside BudgetsProvider');
  }
  return context;
}
