import { createContext, ReactNode, useContext, useState } from 'react';

export type Transaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  note: string;
  date: string; // saved as ISO text, e.g. "2026-10-30T01:10:00.000Z"
};

type NewTransaction = Omit<Transaction, 'id' | 'date'>;

type TransactionsContextType = {
  transactions: Transaction[];
  addTransaction: (t: NewTransaction) => void;
};

const TransactionsContext = createContext<TransactionsContextType | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransaction = (t: NewTransaction) => {
    const newTransaction: Transaction = {
      ...t,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    // newest first
    setTransactions((previous) => [newTransaction, ...previous]);
  };

  return (
    <TransactionsContext.Provider value={{ transactions, addTransaction }}>
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