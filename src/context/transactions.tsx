import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

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

export type TransactionInput = Omit<Transaction, 'id' | 'date'> & { date?: string };

type TransactionsContextType = {
  transactions: Transaction[];
  addTransaction: (transaction: TransactionInput) => void;
  updateTransaction: (id: string, transaction: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
};

const TransactionsContext = createContext<TransactionsContextType | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransaction = (transaction: TransactionInput) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: transaction.date ?? new Date().toISOString(),
    };
    setTransactions((previous) => [newTransaction, ...previous]);
  };

  const updateTransaction = (id: string, transaction: TransactionInput) => {
    setTransactions((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, ...transaction, date: transaction.date ?? item.date }
          : item,
      ),
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((previous) => previous.filter((item) => item.id !== id));
  };

  return (
    <TransactionsContext.Provider
      value={{ transactions, addTransaction, updateTransaction, deleteTransaction }}
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
