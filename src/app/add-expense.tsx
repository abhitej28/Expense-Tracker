import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PaymentMethod, Transaction } from '@/context/transactions';
import { useTransactions } from '@/context/transactions';

const COLORS = {
  background: '#08090D',
  card: '#12141B',
  raised: '#181A23',
  border: '#292B36',
  text: '#F5F5F7',
  muted: '#8D92A1',
  violet: '#A78BFA',
  teal: '#55D6BE',
  red: '#FB7185',
};

const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Education',
  'Health',
  'Travel',
  'Transfers',
  'Other',
];

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Card', 'Bank transfer'];

function getLocalDateInputValue(value?: string) {
  const date = value ? new Date(value) : new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day, 12);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function getSuggestedCategory(
  merchant: string,
  transactions: Transaction[],
  excludeTransactionId?: string,
) {
  const normalizedMerchant = merchant.trim().toLocaleLowerCase();
  if (!normalizedMerchant) return null;

  const previousMatch = transactions.find((transaction) =>
    transaction.id !== excludeTransactionId &&
    transaction.merchant.trim().toLocaleLowerCase() === normalizedMerchant,
  );

  return previousMatch?.category ?? null;
}

export default function AddExpenseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const transactionId = Array.isArray(id) ? id[0] : id;
  const { transactions, addTransaction, updateTransaction } = useTransactions();
  const editingTransaction = transactions.find((transaction) => transaction.id === transactionId);
  const [merchant, setMerchant] = useState(() => editingTransaction?.merchant ?? '');
  const [amount, setAmount] = useState(() => editingTransaction?.amount.toString() ?? '');
  const [category, setCategory] = useState<string | null>(() => editingTransaction?.category ?? null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(() => editingTransaction?.paymentMethod ?? null);
  const [date, setDate] = useState(() => getLocalDateInputValue(editingTransaction?.date));
  const [note, setNote] = useState(() => editingTransaction?.note ?? '');
  const [error, setError] = useState('');
  const [categoryManuallySelected, setCategoryManuallySelected] = useState(
    () => Boolean(editingTransaction?.category),
  );

  const suggestedCategory = getSuggestedCategory(merchant, transactions, transactionId);

  const handleMerchantChange = (value: string) => {
    setMerchant(value);
    if (!categoryManuallySelected) {
      setCategory(getSuggestedCategory(value, transactions, transactionId));
    }
  };

  const handleAmountChange = (text: string) => {
    if (/^\d*\.?\d{0,2}$/.test(text)) setAmount(text);
  };

  const handleSave = () => {
    const parsedAmount = Number(amount);
    const parsedDate = parseDateInput(date);

    if (!merchant.trim()) {
      setError('Enter a merchant or description.');
      return;
    }
    if (!amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!category) {
      setError('Choose a category.');
      return;
    }
    if (!paymentMethod) {
      setError('Choose a payment method.');
      return;
    }
    if (!parsedDate) {
      setError('Enter a valid date in YYYY-MM-DD format.');
      return;
    }

    const transactionInput = {
      merchant: merchant.trim(),
      amount: parsedAmount,
      category,
      paymentMethod,
      note: note.trim(),
      date: parsedDate.toISOString(),
    };
    if (transactionId) {
      updateTransaction(transactionId, transactionInput);
    } else {
      addTransaction(transactionInput);
    }
    setError('');
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>{transactionId ? 'UPDATE YOUR SPENDING' : 'TRACK A PURCHASE'}</Text>
              <Text style={styles.title}>{transactionId ? 'Edit expense' : 'Add an expense'}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={21} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>MERCHANT OR DESCRIPTION</Text>
          <TextInput
            style={styles.input}
            value={merchant}
            onChangeText={handleMerchantChange}
            placeholder="e.g. Sharma Stores"
            placeholderTextColor={COLORS.muted}
            returnKeyType="next"
            accessibilityLabel="Merchant or description"
          />
          {suggestedCategory ? (
            <View style={styles.suggestion}>
              <Ionicons name="sparkles-outline" size={15} color={COLORS.violet} />
              <Text style={styles.suggestionText}>
                {category === suggestedCategory
                  ? `Matched to ${suggestedCategory} from your previous expenses.`
                  : `You previously used ${suggestedCategory} for this merchant.`}
              </Text>
              {category !== suggestedCategory ? (
                <TouchableOpacity
                  onPress={() => {
                    setCategory(suggestedCategory);
                    setCategoryManuallySelected(true);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.useSuggestion}>Use</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.label}>AMOUNT</Text>
          <View style={styles.amountField}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor={COLORS.muted}
              keyboardType="decimal-pad"
              accessibilityLabel="Amount in rupees"
            />
          </View>

          <Text style={styles.label}>DATE</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.muted}
            maxLength={10}
            autoCapitalize="none"
            accessibilityLabel="Expense date, year month day"
          />
          <Text style={styles.helperText}>Use year-month-day format, for example 2026-11-04.</Text>

          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((item) => {
              const selected = item === category;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    setCategory(item);
                    setCategoryManuallySelected(true);
                  }}
                  style={[styles.chip, selected && styles.chipSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>PAYMENT METHOD</Text>
          <View style={styles.chips}>
            {PAYMENT_METHODS.map((method) => {
              const selected = method === paymentMethod;
              return (
                <TouchableOpacity
                  key={method}
                  onPress={() => setPaymentMethod(method)}
                  style={[styles.chip, selected && styles.methodChipSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.chipText, selected && styles.methodTextSelected]}>{method}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>NOTE <Text style={styles.optional}>(OPTIONAL)</Text></Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="Anything to remember?"
            placeholderTextColor={COLORS.muted}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Optional note"
          />

          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            accessibilityRole="button"
          >
            <Ionicons name="checkmark" size={19} color={COLORS.background} />
            <Text style={styles.saveText}>{transactionId ? 'Save changes' : 'Save expense'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  content: { padding: 20, paddingBottom: 42 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eyebrow: { color: COLORS.violet, fontSize: 9, fontWeight: '800', letterSpacing: 1.4, marginBottom: 5 },
  title: { color: COLORS.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  closeButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  label: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginTop: 19, marginBottom: 8 },
  input: { minHeight: 48, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.text, fontSize: 14 },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 11, backgroundColor: '#211D2B', borderWidth: 1, borderColor: '#30293F' },
  suggestionText: { flex: 1, color: '#C4BDCF', fontSize: 9, lineHeight: 14 },
  useSuggestion: { color: '#D7CAFF', fontSize: 9, fontWeight: '800', paddingHorizontal: 4 },
  amountField: { minHeight: 61, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.raised, borderWidth: 1, borderColor: '#353140', borderRadius: 16, paddingHorizontal: 15 },
  currency: { color: COLORS.violet, fontSize: 24, fontWeight: '700', marginRight: 9 },
  amountInput: { flex: 1, color: COLORS.text, fontSize: 23, fontWeight: '700', paddingVertical: 10 },
  helperText: { color: COLORS.muted, fontSize: 10, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  chipSelected: { backgroundColor: '#30293F', borderColor: COLORS.violet },
  methodChipSelected: { backgroundColor: '#1D3432', borderColor: COLORS.teal },
  chipText: { color: '#D1D3DC', fontSize: 11, fontWeight: '600' },
  chipTextSelected: { color: '#D7CAFF' },
  methodTextSelected: { color: COLORS.teal },
  optional: { color: '#666B79', fontWeight: '600' },
  noteInput: { minHeight: 78, paddingTop: 12 },
  error: { color: COLORS.red, fontSize: 12, lineHeight: 17, marginTop: 14 },
  saveButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.violet, borderRadius: 16, marginTop: 23 },
  saveText: { color: COLORS.background, fontSize: 14, fontWeight: '800' },
});
