import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBudgets } from '@/context/budgets';
import { useTransactions } from '@/context/transactions';

const COLORS = {
  background: '#08090D',
  surface: '#12141B',
  raised: '#181A23',
  border: '#252833',
  text: '#F5F5F7',
  muted: '#8D92A1',
  violet: '#A78BFA',
  teal: '#55D6BE',
  red: '#FB7185',
};

const DEFAULT_CATEGORIES = [
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

function formatRupees(amount: number) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function parseAmount(value: string) {
  const amount = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

function CategoryBudgetRow({
  category,
  spent,
  limit,
  onSave,
}: {
  category: string;
  spent: number;
  limit?: number;
  onSave: (amount: number | null) => void;
}) {
  const [draft, setDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const progress = limit ? Math.min((spent / limit) * 100, 100) : 0;
  const exceeded = Boolean(limit && spent > limit);

  const save = () => {
    Keyboard.dismiss();
    if (!isEditing) return;
    if (!draft.trim()) {
      onSave(null);
      setIsEditing(false);
      return;
    }
    const amount = parseAmount(draft);
    if (amount <= 0) {
      Alert.alert('Enter a valid limit', 'The category budget must be greater than zero.');
      return;
    }
    onSave(amount);
    setIsEditing(false);
  };

  return (
    <View style={styles.categoryItem}>
      <View style={styles.categoryTopRow}>
        <View style={styles.categoryNameWrap}>
          <Text style={styles.categoryName} numberOfLines={1}>{category}</Text>
          <Text style={styles.spentText}>Spent {formatRupees(spent)} this month</Text>
        </View>
        <View style={styles.inputAndButton}>
          <View style={styles.amountInputWrap}>
            <Text style={styles.rupeePrefix}>₹</Text>
            <TextInput
              value={isEditing ? draft : limit ? String(limit) : ''}
              onChangeText={(value) => {
                setDraft(value);
                setIsEditing(true);
              }}
              placeholder="Limit"
              placeholderTextColor={COLORS.muted}
              keyboardType="decimal-pad"
              selectTextOnFocus
              style={styles.amountInput}
              accessibilityLabel={`${category} monthly budget`}
            />
          </View>
          <TouchableOpacity onPress={save} style={styles.saveSmallButton} accessibilityRole="button" accessibilityLabel={`Save ${category} budget`}>
            <Text style={styles.saveSmallText}>{limit ? 'Save' : 'Set'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {limit ? (
        <>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: exceeded ? COLORS.red : COLORS.violet }]} />
          </View>
          <View style={styles.limitStatusRow}>
            <Text style={styles.limitStatus}>
              {exceeded ? `Over by ${formatRupees(spent - limit)}` : `${formatRupees(Math.max(limit - spent, 0))} left`}
            </Text>
            <Text style={[styles.limitStatus, exceeded && styles.exceededText]}>
              {Math.round((spent / limit) * 100)}% of {formatRupees(limit)}
            </Text>
          </View>
        </>
      ) : (
        <Text style={styles.noLimitText}>No category limit set</Text>
      )}
    </View>
  );
}

export default function BudgetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { budgets, setMonthlyLimit, setCategoryLimit } = useBudgets();
  const { transactions } = useTransactions();
  const [monthlyDraft, setMonthlyDraft] = useState('');
  const [isEditingMonthly, setIsEditingMonthly] = useState(false);
  const now = new Date();

  const monthlyTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    return !Number.isNaN(date.getTime()) &&
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth();
  });
  const totalSpent = monthlyTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const remaining = Math.max(budgets.monthlyLimit - totalSpent, 0);
  const overBudget = totalSpent > budgets.monthlyLimit;
  const monthlyProgress = Math.min((totalSpent / budgets.monthlyLimit) * 100, 100);
  const categorySpent = monthlyTransactions.reduce<Record<string, number>>((totals, transaction) => {
    totals[transaction.category] = (totals[transaction.category] ?? 0) + transaction.amount;
    return totals;
  }, {});
  const categories = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...transactions.map((transaction) => transaction.category).filter(Boolean),
  ]));

  const saveMonthlyBudget = () => {
    Keyboard.dismiss();
    if (!isEditingMonthly) return;
    const amount = parseAmount(monthlyDraft);
    if (amount <= 0) {
      Alert.alert('Enter a valid budget', 'Your monthly budget must be greater than zero.');
      return;
    }
    setMonthlyLimit(amount);
    setIsEditingMonthly(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>PLAN YOUR SPENDING</Text>
            <Text style={styles.title}>Budgets</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.monthCard}>
          <View style={styles.monthCardTop}>
            <View>
              <Text style={styles.cardEyebrow}>MONTHLY SPENDING LIMIT</Text>
              <Text style={styles.monthlyAmount}>{formatRupees(budgets.monthlyLimit)}</Text>
            </View>
            <View style={styles.monthIcon}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.violet} />
            </View>
          </View>
          <View style={styles.monthlyInputRow}>
            <View style={styles.monthlyInputWrap}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                value={isEditingMonthly ? monthlyDraft : String(budgets.monthlyLimit)}
                onChangeText={(value) => {
                  setMonthlyDraft(value);
                  setIsEditingMonthly(true);
                }}
                keyboardType="decimal-pad"
                selectTextOnFocus
                style={styles.monthlyInput}
                accessibilityLabel="Monthly spending budget in rupees"
              />
            </View>
            <TouchableOpacity onPress={saveMonthlyBudget} style={styles.saveButton} accessibilityRole="button">
              <Text style={styles.saveButtonText}>Save limit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${monthlyProgress}%`, backgroundColor: overBudget ? COLORS.red : COLORS.violet }]} />
          </View>
          <View style={styles.monthlyStatusRow}>
            <Text style={styles.statusText}>Spent {formatRupees(totalSpent)}</Text>
            <Text style={[styles.statusText, overBudget && styles.exceededText]}>
              {overBudget ? `Over by ${formatRupees(totalSpent - budgets.monthlyLimit)}` : `${formatRupees(remaining)} left`}
            </Text>
          </View>
          <Text style={styles.helperText}>This limit resets at the start of each calendar month.</Text>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Category limits</Text>
            <Text style={styles.sectionSubtitle}>Set optional monthly caps for individual categories.</Text>
          </View>
        </View>

        <View style={styles.categoryCard}>
          {categories.map((category, index) => (
            <View key={category} style={index > 0 ? styles.rowDivider : undefined}>
              <CategoryBudgetRow
                category={category}
                spent={categorySpent[category] ?? 0}
                limit={budgets.categoryLimits[category]}
                onSave={(amount) => setCategoryLimit(category, amount)}
              />
            </View>
          ))}
        </View>

        <Text style={styles.footer}>BUDGETS ARE SAVED LOCALLY ON THIS DEVICE</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'center' },
  headerSpacer: { width: 40 },
  eyebrow: { color: COLORS.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1.1 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800', marginTop: 4 },
  monthCard: { padding: 18, borderRadius: 21, backgroundColor: COLORS.raised, borderWidth: 1, borderColor: '#2B2D39', marginBottom: 25 },
  monthCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardEyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '700', letterSpacing: 0.9 },
  monthlyAmount: { color: COLORS.text, fontSize: 30, fontWeight: '800', marginTop: 7 },
  monthIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#292435', alignItems: 'center', justifyContent: 'center' },
  monthlyInputRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 17 },
  monthlyInputWrap: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 11 },
  rupeePrefix: { color: COLORS.muted, fontSize: 13, fontWeight: '700', marginRight: 5 },
  monthlyInput: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '600', paddingVertical: 0 },
  saveButton: { height: 44, paddingHorizontal: 15, borderRadius: 12, backgroundColor: COLORS.violet, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 7, backgroundColor: '#343641', overflow: 'hidden', marginTop: 18 },
  progressFill: { height: '100%', borderRadius: 7 },
  monthlyStatusRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  statusText: { color: COLORS.muted, fontSize: 9, fontWeight: '600' },
  exceededText: { color: COLORS.red },
  helperText: { color: COLORS.muted, fontSize: 9, marginTop: 13 },
  sectionHeading: { marginBottom: 12 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  sectionSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  categoryCard: { paddingHorizontal: 14, borderRadius: 19, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginBottom: 18 },
  rowDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  categoryItem: { paddingVertical: 13 },
  categoryTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  categoryNameWrap: { flex: 1 },
  categoryName: { color: COLORS.text, fontSize: 11, fontWeight: '700' },
  spentText: { color: COLORS.muted, fontSize: 8, marginTop: 4 },
  inputAndButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  amountInputWrap: { flexDirection: 'row', alignItems: 'center', width: 100, height: 36, borderRadius: 10, backgroundColor: COLORS.raised, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 8 },
  amountInput: { flex: 1, color: COLORS.text, fontSize: 10, paddingVertical: 0 },
  saveSmallButton: { minWidth: 42, height: 36, borderRadius: 10, backgroundColor: '#292435', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  saveSmallText: { color: '#D4C8FF', fontSize: 9, fontWeight: '800' },
  noLimitText: { color: COLORS.muted, fontSize: 8, marginTop: 8 },
  limitStatusRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  limitStatus: { color: COLORS.muted, fontSize: 8 },
  footer: { color: '#696D79', fontSize: 7, fontWeight: '700', letterSpacing: 0.8, textAlign: 'center', marginBottom: 12 },
});
