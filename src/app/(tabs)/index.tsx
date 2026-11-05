import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { useBudgets } from '@/context/budgets';
import type { Transaction } from '@/context/transactions';
import { useTransactions } from '@/context/transactions';

const COLORS = {
  background: '#08090D',
  surface: '#12141B',
  surfaceRaised: '#181A23',
  border: '#252833',
  text: '#F5F5F7',
  muted: '#8D92A1',
  violet: '#A78BFA',
  teal: '#55D6BE',
  orange: '#F5A66D',
  pink: '#F2789A',
  blue: '#77A9FF',
  red: '#FB7185',
};

type IconName = keyof typeof Ionicons.glyphMap;
const CATEGORY_STYLES: Record<string, { icon: IconName; color: string }> = {
  'Food & Dining': { icon: 'fast-food-outline', color: COLORS.orange },
  Groceries: { icon: 'cart-outline', color: COLORS.teal },
  Transport: { icon: 'car-outline', color: COLORS.violet },
  Shopping: { icon: 'bag-outline', color: COLORS.pink },
  'Bills & Utilities': { icon: 'receipt-outline', color: COLORS.blue },
  Entertainment: { icon: 'film-outline', color: '#E78AEF' },
  Education: { icon: 'school-outline', color: '#F4CF68' },
  Health: { icon: 'medkit-outline', color: '#5CD6C8' },
  Travel: { icon: 'airplane-outline', color: '#67C4E8' },
  Transfers: { icon: 'swap-horizontal-outline', color: '#B6A9E8' },
  Other: { icon: 'ellipsis-horizontal-circle-outline', color: COLORS.muted },
};

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Other;
}

function isInCurrentMonth(isoDate: string, now: Date) {
  const date = new Date(isoDate);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function formatTransactionDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const sameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

  if (sameDay(date, now)) return `Today · ${time}`;
  if (sameDay(date, yesterday)) return `Yesterday · ${time}`;
  return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${time}`;
}

type CategoryTotal = { amount: number; count: number };

function DonutChart({
  categories,
  total,
}: {
  categories: [string, CategoryTotal][];
  total: number;
}) {
  const size = 190;
  const center = size / 2;
  const radius = 69;
  const strokeWidth = 19;
  const circumference = 2 * Math.PI * radius;

  return (
    <View
      style={styles.donutWrap}
      accessibilityRole="image"
      accessibilityLabel={`Spending by category. Total ₹${total.toLocaleString('en-IN')}.`}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#2A2C36"
          strokeWidth={strokeWidth}
        />
        {categories.map(([name, values], index) => {
          const share = total > 0 ? values.amount / total : 0;
          const segmentLength = Math.max(0, circumference * share - 2.5);
          const amountBefore = categories
            .slice(0, index)
            .reduce((sum, [, previous]) => sum + previous.amount, 0);
          const segmentOffset = total > 0 ? (circumference * amountBefore) / total : 0;

          if (segmentLength <= 0) return null;

          return (
            <Circle
              key={name}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={getCategoryStyle(name).color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference}`}
              strokeDashoffset={-segmentOffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${center} ${center})`}
            />
          );
        })}
      </Svg>
      <View style={styles.donutCenter} pointerEvents="none">
        <Text style={styles.donutEyebrow}>THIS MONTH</Text>
        <Text style={styles.donutTotal} numberOfLines={1} adjustsFontSizeToFit>
          ₹{total.toLocaleString('en-IN')}
        </Text>
        <Text style={styles.donutCaption}>
          {categories.length} {categories.length === 1 ? 'category' : 'categories'}
        </Text>
      </View>
    </View>
  );
}

function SectionHeading({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onPress ? (
        <TouchableOpacity onPress={onPress} accessibilityRole="button">
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const monthlyBudget = budgets.monthlyLimit;
  const now = new Date();
  const currentMonthTransactions = transactions.filter((transaction) => isInCurrentMonth(transaction.date, now));
  const totalSpent = currentMonthTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
  const budgetUsed = (totalSpent / monthlyBudget) * 100;
  const categoryTotals = currentMonthTransactions.reduce<Record<string, { amount: number; count: number }>>(
    (totals, transaction) => {
      const current = totals[transaction.category] ?? { amount: 0, count: 0 };
      totals[transaction.category] = {
        amount: current.amount + transaction.amount,
        count: current.count + 1,
      };
      return totals;
    },
    {},
  );
  const categories = Object.entries(categoryTotals).sort((first, second) => second[1].amount - first[1].amount);
  const recentTransactions = [...transactions]
    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
    .slice(0, 4);
  const smallTransactions = currentMonthTransactions.filter((transaction) => transaction.amount < 200);
  const smallSpendTotal = smallTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const monthName = now.toLocaleDateString('en-IN', { month: 'long' });
  const budgetExceeded = budgetUsed >= 100;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 118 }]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>YOUR MONEY, YOUR CONTROL</Text>
            <Text style={styles.appName}>Pennywise</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            accessibilityRole="button"
            accessibilityLabel="Profile and settings"
            onPress={() => router.push('/explore')}
          >
            <Ionicons name="person-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>TOTAL SPENT THIS MONTH</Text>
              <Text style={styles.totalAmount}>₹{totalSpent.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.monthBadge}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.violet} />
              <Text style={styles.monthText}>{monthName}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          <View style={styles.budgetRow}>
            <View>
              <Text style={styles.secondaryLabel}>Monthly budget</Text>
              <Text style={styles.budgetValue}>₹{monthlyBudget.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.remainingContainer}>
              <Text style={styles.secondaryLabel}>Remaining</Text>
              <Text style={[styles.remainingValue, budgetExceeded && styles.overBudgetValue]}>
                ₹{remainingBudget.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                budgetExceeded && styles.overBudgetFill,
                { width: `${Math.min(budgetUsed, 100)}%` },
              ]}
            />
          </View>
          <View style={styles.budgetFoot}>
            <Text style={styles.progressCaption}>{budgetUsed.toFixed(1)}% of monthly budget used</Text>
            <Text style={[styles.budgetStatus, budgetExceeded && styles.overBudgetValue]}>
              {budgetExceeded ? 'Budget reached' : 'On track'}
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Ionicons name="flash-outline" size={19} color={COLORS.violet} />
          </View>
          <View style={styles.insightBody}>
            <Text style={styles.insightEyebrow}>A QUICK INSIGHT</Text>
            <Text style={styles.insightTitle}>Small spends add up</Text>
            <Text style={styles.insightDescription}>
              {smallTransactions.length > 0
                ? `₹${smallSpendTotal.toLocaleString('en-IN')} across ${smallTransactions.length} purchases under ₹200 this month.`
                : 'Purchases under ₹200 will show here as you add expenses.'}
            </Text>
            <TouchableOpacity onPress={() => router.push('/explore')} accessibilityRole="button">
              <Text style={styles.insightAction}>Explore insights <Text style={styles.arrow}>→</Text></Text>
            </TouchableOpacity>
          </View>
        </View>

        <SectionHeading title="Spending breakdown" />
        <View style={styles.categoryCard}>
          <View style={styles.categorySummary}>
            <View>
              <Text style={styles.summaryLabel}>Across {categories.length} categories</Text>
              <Text style={styles.summaryAmount}>₹{totalSpent.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.legend}>
              {categories.map(([name]) => (
                <View key={name} style={[styles.legendDot, { backgroundColor: getCategoryStyle(name).color }]} />
              ))}
            </View>
          </View>
          {categories.length === 0 ? (
            <Text style={styles.emptyText}>Add an expense to see your category breakdown.</Text>
          ) : (
            <>
              <DonutChart categories={categories} total={totalSpent} />
              {categories.map(([name, values]) => {
              const categoryStyle = getCategoryStyle(name);
              const share = totalSpent ? (values.amount / totalSpent) * 100 : 0;
              return (
                <View key={name} style={styles.categoryItem}>
                  <View style={styles.categoryRow}>
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryIcon, { backgroundColor: `${categoryStyle.color}1A` }]}>
                        <Ionicons name={categoryStyle.icon} size={17} color={categoryStyle.color} />
                      </View>
                      <View>
                        <Text style={styles.categoryName}>{name}</Text>
                        <Text style={styles.categorySub}>
                          {values.count} {values.count === 1 ? 'expense' : 'expenses'} · {share.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.categoryAmount}>₹{values.amount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.categoryTrack}>
                    <View style={[styles.categoryFill, { width: `${share}%`, backgroundColor: categoryStyle.color }]} />
                  </View>
                </View>
              );
              })}
            </>
          )}
        </View>

        <SectionHeading
          title="Recent transactions"
          action="View all"
          onPress={() => router.push('/transactions')}
        />
        <View style={styles.transactionsCard}>
          {recentTransactions.length === 0 ? (
            <Text style={styles.emptyText}>Your recent expenses will appear here.</Text>
          ) : (
            recentTransactions.map((transaction: Transaction, index) => {
              const categoryStyle = getCategoryStyle(transaction.category);
              return (
                <View
                  key={transaction.id}
                  style={[styles.transactionRow, index !== recentTransactions.length - 1 && styles.transactionBorder]}
                >
                  <View style={[styles.transactionIcon, { backgroundColor: `${categoryStyle.color}1A` }]}>
                    <Ionicons name={categoryStyle.icon} size={19} color={categoryStyle.color} />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.merchantName} numberOfLines={1}>{transaction.merchant}</Text>
                    <Text style={styles.transactionMeta} numberOfLines={1}>
                      {transaction.category} · {transaction.paymentMethod} · {formatTransactionDate(transaction.date)}
                    </Text>
                  </View>
                  <Text style={styles.transactionAmount}>−₹{transaction.amount.toLocaleString('en-IN')}</Text>
                </View>
              );
            })
          )}
        </View>

        <Text style={styles.disclaimer}>NOT CONNECTED TO YOUR BANK · SAVED ON THIS DEVICE</Text>
      </ScrollView>

      <View style={[styles.addDock, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-expense')}
          accessibilityRole="button"
          accessibilityLabel="Add an expense"
        >
          <Ionicons name="add" size={25} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add expense</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 11 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 23 },
  greeting: { color: COLORS.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.55 },
  appName: { color: COLORS.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.7, marginTop: 5 },
  profileButton: { width: 43, height: 43, borderRadius: 15, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  heroCard: { padding: 21, borderRadius: 23, backgroundColor: COLORS.surfaceRaised, borderWidth: 1, borderColor: '#2B2D39', marginBottom: 23 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.15 },
  totalAmount: { color: COLORS.text, fontSize: 37, fontWeight: '800', letterSpacing: -1, marginTop: 9 },
  monthBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#292435', borderRadius: 11, paddingHorizontal: 9, paddingVertical: 8 },
  monthText: { color: '#C7B6FF', fontSize: 10, fontWeight: '700' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 18 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  secondaryLabel: { color: COLORS.muted, fontSize: 11 },
  budgetLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  budgetEdit: { color: '#C7B6FF', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  budgetValue: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginTop: 5 },
  remainingContainer: { alignItems: 'flex-end' },
  remainingValue: { color: COLORS.teal, fontSize: 15, fontWeight: '700', marginTop: 5 },
  overBudgetValue: { color: COLORS.red },
  progressTrack: { height: 6, borderRadius: 8, backgroundColor: '#343641', overflow: 'hidden', marginTop: 19 },
  progressFill: { height: '100%', borderRadius: 8, backgroundColor: COLORS.violet },
  overBudgetFill: { backgroundColor: COLORS.red },
  budgetFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  progressCaption: { color: COLORS.muted, fontSize: 10 },
  budgetStatus: { color: COLORS.teal, fontSize: 10, fontWeight: '700' },
  insightCard: { flexDirection: 'row', padding: 16, borderRadius: 19, backgroundColor: '#17151F', borderWidth: 1, borderColor: '#30293F', marginBottom: 27, gap: 12 },
  insightIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: '#292435', alignItems: 'center', justifyContent: 'center' },
  insightBody: { flex: 1 },
  insightEyebrow: { color: COLORS.violet, fontSize: 8, fontWeight: '800', letterSpacing: 1.15, marginBottom: 5 },
  insightTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 5 },
  insightDescription: { color: '#A5A4B0', fontSize: 11, lineHeight: 16 },
  insightAction: { color: '#C7B6FF', fontSize: 11, fontWeight: '700', marginTop: 9 },
  arrow: { fontSize: 15 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  sectionAction: { color: '#B9A7FF', fontSize: 10, fontWeight: '600' },
  categoryCard: { padding: 16, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginBottom: 27 },
  categorySummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 15, marginBottom: 1, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  summaryLabel: { color: COLORS.muted, fontSize: 10 },
  summaryAmount: { color: COLORS.text, fontSize: 19, fontWeight: '800', marginTop: 4 },
  legend: { flexDirection: 'row', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  donutWrap: { alignSelf: 'center' , width: 190, height: 190, alignItems: 'center', justifyContent: 'center', marginTop: 15, marginBottom: 12 },
  donutCenter: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  donutEyebrow: { color: COLORS.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  donutTotal: { color: COLORS.text, fontSize: 19, fontWeight: '800', maxWidth: 112, marginTop: 5 },
  donutCaption: { color: COLORS.muted, fontSize: 9, marginTop: 3 },
  categoryItem: { paddingTop: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  categoryIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryName: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  categorySub: { color: COLORS.muted, fontSize: 9, marginTop: 3 },
  categoryAmount: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  categoryTrack: { height: 4, backgroundColor: '#2A2C36', borderRadius: 8, overflow: 'hidden', marginLeft: 45 },
  categoryFill: { height: '100%', borderRadius: 8 },
  emptyText: { color: COLORS.muted, fontSize: 11, lineHeight: 17, paddingVertical: 14 },
  transactionsCard: { backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 13, marginBottom: 19 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 10 },
  transactionBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  transactionIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  transactionDetails: { flex: 1 },
  merchantName: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  transactionMeta: { color: COLORS.muted, fontSize: 9, marginTop: 4 },
  transactionAmount: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  disclaimer: { color: '#696D79', fontSize: 8, fontWeight: '700', letterSpacing: 1, textAlign: 'center', marginTop: 1, marginBottom: 12 },
  addDock: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingTop: 20, backgroundColor: 'rgba(8,9,13,0.96)' },
  addButton: { minWidth: 178, flexDirection: 'row', alignItems: 'center', 
  justifyContent: 'center', gap: 8, backgroundColor: COLORS.violet, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 18, shadowColor: COLORS.violet, shadowOpacity: 0.24, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  addButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
