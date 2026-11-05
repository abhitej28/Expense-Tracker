import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export type PaymentMethod = 'UPI' | 'Cash' | 'Card' | 'Bank transfer';

export type Transaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  note: string;
  paymentMethod: PaymentMethod;
  date: string;
};

export type TransactionInput = Omit<Transaction, 'id' | 'date'> & {
  date?: string;
};

type TransactionsContextType = {
  transactions: Transaction[];
  addTransaction: (transaction: TransactionInput) => void;
  updateTransaction: (id: string, transaction: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
};

const STORAGE_KEY = '@pennywise/transactions-v1';

const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Cash',
  'Card',
  'Bank transfer',
];

const TransactionsContext = createContext<TransactionsContextType | null>(null);

function isTransaction(value: unknown): value is Transaction {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.merchant === 'string' &&
    typeof candidate.category === 'string' &&
    typeof candidate.amount === 'number' &&
    Number.isFinite(candidate.amount) &&
    typeof candidate.note === 'string' &&
    PAYMENT_METHODS.includes(candidate.paymentMethod as PaymentMethod) &&
    typeof candidate.date === 'string' &&
    !Number.isNaN(new Date(candidate.date).getTime())
  );
}

export function TransactionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isMounted = true;

    async function loadTransactions() {
      try {
        const savedValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (!isMounted || !savedValue) {
          return;
        }

        const parsedValue: unknown = JSON.parse(savedValue);

        if (Array.isArray(parsedValue)) {
          setTransactions(parsedValue.filter(isTransaction));
        }
      } catch (error) {
        console.warn('Could not load saved expenses.', error);
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    }

    void loadTransactions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const snapshot = JSON.stringify(transactions);

    writeQueue.current = writeQueue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(STORAGE_KEY, snapshot))
      .catch((error: unknown) => {
        console.warn('Could not save expenses on this device.', error);
      });
  }, [isLoaded, transactions]);

  const addTransaction = (transaction: TransactionInput) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: transaction.date ?? new Date().toISOString(),
    };

    setTransactions((previous) => [newTransaction, ...previous]);
  };

  const updateTransaction = (
    id: string,
    transaction: TransactionInput,
  ) => {
    setTransactions((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              ...transaction,
              date: transaction.date ?? item.date,
            }
          : item,
      ),
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((previous) =>
      previous.filter((item) => item.id !== id),
    );
  };

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#A78BFA" />
      </View>
    );
  }

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);

  if (!context) {
    throw new Error('useTransactions must be used inside TransactionsProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#08090D',
  },
});