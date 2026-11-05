import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#F5A66D',
  Groceries: COLORS.teal,
  Transport: COLORS.violet,
  Shopping: '#F2789A',
  'Bills & Utilities': '#77A9FF',
  Entertainment: '#E78AEF',
  Education: '#F4CF68',
  Health: '#5CD6C8',
  Travel: '#67C4E8',
  Transfers: '#B6A9E8',
  Other: COLORS.muted,
};

const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Bank transfer'] as const;
const DATE_FILTERS = [
  { key: 'all', label: 'All time' },
  { key: 'month', label: 'This month' },
  { key: '30days', label: 'Last 30 days' },
] as const;

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function TransactionsScreen() {
  const router = useRouter();
  const { transactions, deleteTransaction } = useTransactions();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<(typeof DATE_FILTERS)[number]['key']>('all');
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastThirtyDays = new Date(now);
  lastThirtyDays.setDate(now.getDate() - 30);
  const sortedTransactions = [...transactions].sort(
    (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime(),
  );
  const categories = Array.from(new Set(transactions.map((transaction) => transaction.category))).sort();
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredTransactions = sortedTransactions.filter((transaction) => {
    const matchesSearch = !normalizedQuery || [
      transaction.merchant,
      transaction.category,
      transaction.paymentMethod,
      transaction.note,
    ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    const matchesCategory = !selectedCategory || transaction.category === selectedCategory;
    const matchesPayment = !selectedPayment || transaction.paymentMethod === selectedPayment;
    const transactionDate = new Date(transaction.date);
    const matchesDate = dateFilter === 'all' || (
      !Number.isNaN(transactionDate.getTime()) &&
      (dateFilter === 'month' ? transactionDate >= monthStart : transactionDate >= lastThirtyDays) &&
      transactionDate <= now
    );
    return matchesSearch && matchesCategory && matchesPayment && matchesDate;
  });
  const total = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const hasActiveFilters = Boolean(
    normalizedQuery || selectedCategory || selectedPayment || dateFilter !== 'all',
  );
  const activeFilterCount = Number(Boolean(selectedCategory)) +
    Number(Boolean(selectedPayment)) + Number(dateFilter !== 'all');

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedPayment(null);
    setDateFilter('all');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>YOUR SPENDING</Text>
            <Text style={styles.title}>Transactions</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-expense')}
            accessibilityRole="button"
            accessibilityLabel="Add expense"
          >
            <Ionicons name="add" size={23} color={COLORS.background} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search merchant, note, category..."
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Search transactions"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityRole="button" accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => setShowFilters((visible) => !visible)}
            style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            accessibilityRole="button"
            accessibilityLabel="Toggle transaction filters"
          >
            <Ionicons name="options-outline" size={17} color={showFilters ? COLORS.violet : COLORS.text} />
            {activeFilterCount > 0 ? <Text style={styles.filterCount}>{activeFilterCount}</Text> : null}
          </TouchableOpacity>
        </View>

        {showFilters ? (
          <View style={styles.filtersCard}>
            <View style={styles.filterHeadingRow}>
              <Text style={styles.filterHeading}>DATE</Text>
              {hasActiveFilters ? (
                <TouchableOpacity onPress={clearFilters} accessibilityRole="button">
                  <Text style={styles.clearText}>Clear filters</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.filterChips}>
              {DATE_FILTERS.map((option) => {
                const selected = dateFilter === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setDateFilter(option.key)}
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.filterHeading}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
              {[null, ...categories].map((category) => {
                const selected = selectedCategory === category;
                return (
                  <TouchableOpacity
                    key={category ?? 'all-categories'}
                    onPress={() => setSelectedCategory(category)}
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                      {category ?? 'All'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.filterHeading}>PAYMENT METHOD</Text>
            <View style={styles.filterChips}>
              {[null, ...PAYMENT_METHODS].map((method) => {
                const selected = selectedPayment === method;
                return (
                  <TouchableOpacity
                    key={method ?? 'all-methods'}
                    onPress={() => setSelectedPayment(method)}
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                      {method ?? 'All'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            {hasActiveFilters ? 'MATCHING EXPENSES' : 'ALL RECORDED EXPENSES'}
          </Text>
          <Text style={styles.totalAmount}>₹{total.toLocaleString('en-IN')}</Text>
          <Text style={styles.transactionCount}>
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </Text>
        </View>

        {sortedTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={24} color={COLORS.violet} />
            </View>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyDescription}>Add your first expense and it will appear here.</Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={() => router.push('/add-expense')}
              accessibilityRole="button"
            >
              <Text style={styles.emptyActionText}>Add an expense</Text>
            </TouchableOpacity>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={23} color={COLORS.violet} />
            </View>
            <Text style={styles.emptyTitle}>No matching expenses</Text>
            <Text style={styles.emptyDescription}>Try another search or clear your filters to see all transactions.</Text>
            <TouchableOpacity style={styles.emptyAction} onPress={clearFilters} accessibilityRole="button">
              <Text style={styles.emptyActionText}>Clear search and filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredTransactions.map((transaction) => {
              const color = CATEGORY_COLORS[transaction.category] ?? COLORS.violet;
              const confirmingDelete = pendingDeleteId === transaction.id;
              return (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionTop}>
                    <View style={[styles.categoryMark, { backgroundColor: `${color}1A` }]}>
                      <View style={[styles.categoryDot, { backgroundColor: color }]} />
                    </View>
                    <View style={styles.details}>
                      <Text style={styles.merchant} numberOfLines={1}>{transaction.merchant}</Text>
                      <Text style={styles.meta} numberOfLines={1}>{transaction.category} · {formatDate(transaction.date)}</Text>
                    </View>
                    <Text style={styles.amount}>−₹{transaction.amount.toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.secondaryRow}>
                    <Text style={styles.method}>{transaction.paymentMethod}</Text>
                    {transaction.note ? <Text style={styles.note} numberOfLines={1}>{transaction.note}</Text> : null}
                  </View>

                  {confirmingDelete ? (
                    <View style={styles.confirmRow}>
                      <Text style={styles.confirmText}>Delete this expense?</Text>
                      <TouchableOpacity
                        onPress={() => {
                          deleteTransaction(transaction.id);
                          setPendingDeleteId(null);
                        }}
                        accessibilityRole="button"
                      >
                        <Text style={styles.deleteConfirm}>Delete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setPendingDeleteId(null)} accessibilityRole="button">
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push({ pathname: '/add-expense', params: { id: transaction.id } })}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${transaction.merchant}`}
                      >
                        <Ionicons name="create-outline" size={15} color={COLORS.violet} />
                        <Text style={styles.editText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setPendingDeleteId(transaction.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${transaction.merchant}`}
                      >
                        <Ionicons name="trash-outline" size={15} color={COLORS.red} />
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.disclaimer}>NOT CONNECTED TO YOUR BANK · SAVED ON THIS DEVICE</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  backButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  headerText: { flex: 1 },
  eyebrow: { color: COLORS.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.3, marginBottom: 4 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  addButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.violet },
  summaryCard: { backgroundColor: COLORS.raised, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 19, marginBottom: 22 },
  searchRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, marginBottom: 12 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 11, paddingVertical: 10 },
  filterButton: { minWidth: 31, height: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 10, backgroundColor: COLORS.raised, paddingHorizontal: 6 },
  filterButtonActive: { borderWidth: 1, borderColor: COLORS.violet },
  filterCount: { color: COLORS.violet, fontSize: 9, fontWeight: '800' },
  filtersCard: { padding: 13, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, marginBottom: 14, gap: 8 },
  filterHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterHeading: { color: COLORS.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.9, marginTop: 4 },
  clearText: { color: '#C7B6FF', fontSize: 9, fontWeight: '700' },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 9, backgroundColor: COLORS.raised, borderWidth: 1, borderColor: COLORS.border },
  filterChipSelected: { backgroundColor: '#30293F', borderColor: COLORS.violet },
  filterChipText: { color: '#C4C6D0', fontSize: 8, fontWeight: '600' },
  filterChipTextSelected: { color: '#D7CAFF' },
  summaryLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  totalAmount: { color: COLORS.text, fontSize: 30, fontWeight: '800', marginTop: 8 },
  transactionCount: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  emptyCard: { alignItems: 'center', padding: 25, backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  emptyIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#292435', marginBottom: 12 },
  emptyTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  emptyDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 6 },
  emptyAction: { marginTop: 15, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.violet },
  emptyActionText: { color: COLORS.background, fontSize: 11, fontWeight: '800' },
  list: { gap: 11 },
  transactionCard: { backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 14 },
  transactionTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryMark: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  details: { flex: 1 },
  merchant: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  meta: { color: COLORS.muted, fontSize: 9, marginTop: 4 },
  amount: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  secondaryRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginLeft: 48, marginTop: 6 },
  method: { color: COLORS.teal, fontSize: 9, fontWeight: '700' },
  note: { flex: 1, color: COLORS.muted, fontSize: 9 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 18, borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 12, paddingTop: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 2 },
  editText: { color: COLORS.violet, fontSize: 10, fontWeight: '700' },
  deleteText: { color: COLORS.red, fontSize: 10, fontWeight: '700' },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 15, borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 12, paddingTop: 10 },
  confirmText: { flex: 1, color: COLORS.text, fontSize: 10 },
  deleteConfirm: { color: COLORS.red, fontSize: 10, fontWeight: '800' },
  cancelText: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  disclaimer: { color: '#696D79', fontSize: 8, fontWeight: '700', letterSpacing: 1, textAlign: 'center', marginTop: 20 },
});
