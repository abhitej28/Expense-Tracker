import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
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
  orange: '#F5A66D',
  pink: '#F2789A',
  blue: '#77A9FF',
  red: '#FB7185',
};

type Period = 'week' | 'month';
type TrendPoint = { label: string; amount: number };

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': COLORS.orange,
  Groceries: COLORS.teal,
  Transport: COLORS.violet,
  Shopping: COLORS.pink,
  'Bills & Utilities': COLORS.blue,
  Entertainment: '#E78AEF',
  Education: '#F4CF68',
  Health: '#5CD6C8',
  Travel: '#67C4E8',
  Transfers: '#B6A9E8',
  Other: COLORS.muted,
};

function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? COLORS.muted;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function sumAmounts(items: { amount: number }[]) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

function formatRupees(amount: number) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function SectionHeading({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
    </View>
  );
}

function TrendChart({ points }: { points: TrendPoint[] }) {
  const maxAmount = Math.max(...points.map((point) => point.amount), 0);

  return (
    <View style={styles.chart}>
      {points.map((point, index) => {
        const hasSpend = point.amount > 0;
        const height = hasSpend && maxAmount > 0
          ? Math.max(8, (point.amount / maxAmount) * 100)
          : 4;
        const isHighest = hasSpend && point.amount === maxAmount;

        return (
          <View key={`${point.label}-${index}`} style={styles.chartColumn}>
            <Text style={styles.chartAmount} numberOfLines={1}>
              {hasSpend ? formatRupees(point.amount) : ''}
            </Text>
            <View style={styles.barArea}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: isHighest ? COLORS.violet : '#51476F',
                  },
                ]}
              />
            </View>
            <Text style={styles.chartLabel}>{point.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const [period, setPeriod] = useState<Period>('month');
  const now = useMemo(() => new Date(), []);
  const monthlySpent = transactions
    .filter((transaction) => {
      const date = new Date(transaction.date);
      return !Number.isNaN(date.getTime()) &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth();
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlyBudgetProgress = Math.min((monthlySpent / budgets.monthlyLimit) * 100, 100);
  const monthlyBudgetExceeded = monthlySpent > budgets.monthlyLimit;

  const periodData = useMemo(() => {
    const today = startOfDay(now);
    const currentStart = period === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    const currentEnd = new Date(today);
    currentEnd.setDate(currentEnd.getDate() + 1);

    const previousStart = period === 'month'
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
      : new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() - 7);
    const previousEnd = currentStart;

    const validTransactions = transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return Number.isFinite(transaction.amount) && transaction.amount > 0 && !Number.isNaN(date.getTime());
    });

    const current = validTransactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return date >= currentStart && date < currentEnd;
    });
    const previous = validTransactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return date >= previousStart && date < previousEnd;
    });

    const categories = Object.entries(
      current.reduce<Record<string, { amount: number; count: number }>>((totals, transaction) => {
        const previousTotal = totals[transaction.category] ?? { amount: 0, count: 0 };
        totals[transaction.category] = {
          amount: previousTotal.amount + transaction.amount,
          count: previousTotal.count + 1,
        };
        return totals;
      }, {}),
    ).sort((first, second) => second[1].amount - first[1].amount);

    const merchants = Object.entries(
      current.reduce<Record<string, { merchant: string; amount: number; count: number }>>((totals, transaction) => {
        const key = transaction.merchant.trim().toLocaleLowerCase();
        const merchant = totals[key] ?? {
          merchant: transaction.merchant.trim() || 'Unknown merchant',
          amount: 0,
          count: 0,
        };
        totals[key] = {
          ...merchant,
          amount: merchant.amount + transaction.amount,
          count: merchant.count + 1,
        };
        return totals;
      }, {}),
    ).map(([, merchant]) => merchant)
      .sort((first, second) => second.amount - first.amount)
      .slice(0, 3);

    const trendPoints: TrendPoint[] = period === 'week'
      ? Array.from({ length: 7 }, (_, index) => {
          const day = new Date(currentStart);
          day.setDate(currentStart.getDate() + index);
          const dayAmount = current
            .filter((transaction) => {
              const date = new Date(transaction.date);
              return date.getFullYear() === day.getFullYear() &&
                date.getMonth() === day.getMonth() &&
                date.getDate() === day.getDate();
            })
            .reduce((sum, transaction) => sum + transaction.amount, 0);
          return {
            label: day.toLocaleDateString('en-IN', { weekday: 'short' }),
            amount: dayAmount,
          };
        })
      : Array.from({ length: Math.ceil(now.getDate() / 7) }, (_, index) => {
          const firstDay = index * 7 + 1;
          const lastDay = Math.min(firstDay + 6, now.getDate());
          const amount = current
            .filter((transaction) => {
              const day = new Date(transaction.date).getDate();
              return day >= firstDay && day <= lastDay;
            })
            .reduce((sum, transaction) => sum + transaction.amount, 0);
          return { label: `D${firstDay}–${lastDay}`, amount };
        });

    const total = sumAmounts(current);
    const previousTotal = sumAmounts(previous);
    const elapsedDays = period === 'week' ? 7 : now.getDate();

    return {
      current,
      categories,
      merchants,
      trendPoints,
      total,
      previousTotal,
      averagePerDay: total / Math.max(1, elapsedDays),
      changePercent: previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null,
    };
  }, [now, period, transactions]);

  const periodName = period === 'month' ? now.toLocaleDateString('en-IN', { month: 'long' }) : 'Last 7 days';
  const comparisonName = period === 'month' ? 'vs previous month' : 'vs previous 7 days';
  const topCategory = periodData.categories[0];
  const maxCategoryAmount = topCategory?.[1].amount ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 38 }]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR SPENDING, AT A GLANCE</Text>
            <Text style={styles.title}>Insights</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="analytics-outline" size={21} color={COLORS.violet} />
          </View>
        </View>

        <View style={styles.periodSwitch}>
          {(['week', 'month'] as const).map((value) => (
            <TouchableOpacity
              key={value}
              onPress={() => setPeriod(value)}
              style={[styles.periodOption, period === value && styles.periodOptionSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected: period === value }}
            >
              <Text style={[styles.periodText, period === value && styles.periodTextSelected]}>
                {value === 'week' ? '7 days' : 'This month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.cardEyebrow}>TOTAL SPENT · {periodName.toUpperCase()}</Text>
              <Text style={styles.totalAmount}>{formatRupees(periodData.total)}</Text>
            </View>
            <View style={styles.summaryIcon}>
              <Ionicons name="wallet-outline" size={19} color={COLORS.violet} />
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStats}>
            <View>
              <Text style={styles.statLabel}>Daily average</Text>
              <Text style={styles.statValue}>{formatRupees(periodData.averagePerDay)}</Text>
            </View>
            <View style={styles.statSeparator} />
            <View>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={styles.statValue}>{periodData.current.length}</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.changeStat}>
              <Text style={styles.statLabel}>{comparisonName}</Text>
              <Text
                style={[
                  styles.statValue,
                  periodData.changePercent === null
                    ? styles.neutralValue
                    : periodData.changePercent > 0
                      ? styles.negativeValue
                      : styles.positiveValue,
                ]}
              >
                {periodData.changePercent === null
                  ? '—'
                  : `${periodData.changePercent > 0 ? '+' : ''}${periodData.changePercent.toFixed(0)}%`}
              </Text>
            </View>
          </View>
          {periodData.changePercent !== null ? (
            <Text style={styles.comparisonHint}>
              {periodData.changePercent > 0 ? 'You spent more' : periodData.changePercent < 0 ? 'You spent less' : 'Spending was unchanged'}
              {' '}than the previous period.
            </Text>
          ) : (
            <Text style={styles.comparisonHint}>Add expenses in both periods to compare spending.</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.budgetLinkCard}
          onPress={() => router.push('/budgets')}
          accessibilityRole="button"
          accessibilityLabel="View and edit your monthly and category budgets"
        >
          <View style={styles.budgetLinkTop}>
            <View>
              <Text style={styles.budgetLinkEyebrow}>MONTHLY BUDGET</Text>
              <Text style={styles.budgetLinkAmount}>
                {formatRupees(monthlySpent)} <Text style={styles.budgetLinkOf}>of {formatRupees(budgets.monthlyLimit)}</Text>
              </Text>
            </View>
            <View style={styles.budgetLinkIcon}>
              <Ionicons name="chevron-forward" size={16} color="#C7B6FF" />
            </View>
          </View>
          <View style={styles.budgetTrack}>
            <View
              style={[
                styles.budgetFill,
                {
                  width: `${monthlyBudgetProgress}%`,
                  backgroundColor: monthlyBudgetExceeded ? COLORS.red : COLORS.violet,
                },
              ]}
            />
          </View>
          <Text style={[styles.budgetLinkStatus, monthlyBudgetExceeded && styles.negativeValue]}>
            {monthlyBudgetExceeded
              ? `Over by ${formatRupees(monthlySpent - budgets.monthlyLimit)}`
              : `${formatRupees(budgets.monthlyLimit - monthlySpent)} remaining · Manage budgets`}
          </Text>
        </TouchableOpacity>

        <SectionHeading title="Spending trend" detail={period === 'week' ? 'Daily' : 'By week'} />
        <View style={styles.panel}>
          {periodData.total === 0 ? (
            <Text style={styles.emptyText}>Your spending trend will appear here once you add expenses for this period.</Text>
          ) : (
            <TrendChart points={periodData.trendPoints} />
          )}
        </View>

        <SectionHeading title="Categories" detail={periodData.categories.length ? `${periodData.categories.length} total` : undefined} />
        <View style={styles.panel}>
          {periodData.categories.length === 0 ? (
            <Text style={styles.emptyText}>Category insights will appear here after you record an expense.</Text>
          ) : (
            periodData.categories.map(([name, values], index) => {
              const share = periodData.total > 0 ? values.amount / periodData.total : 0;
              const isTop = index === 0;
              return (
                <View key={name} style={[styles.categoryItem, index > 0 && styles.itemDivider]}>
                  <View style={styles.rowBetween}>
                    <View style={styles.categoryTitleRow}>
                      <View style={[styles.colorDot, { backgroundColor: categoryColor(name) }]} />
                      <Text style={styles.categoryName} numberOfLines={1}>{name}</Text>
                      {isTop ? <Text style={styles.topTag}>TOP</Text> : null}
                    </View>
                    <Text style={styles.categoryAmount}>{formatRupees(values.amount)}</Text>
                  </View>
                  <View style={styles.categoryMetaRow}>
                    <Text style={styles.categoryMeta}>
                      {values.count} {values.count === 1 ? 'expense' : 'expenses'}
                    </Text>
                    <Text style={styles.categoryMeta}>{(share * 100).toFixed(0)}%</Text>
                  </View>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.fill,
                        {
                          width: `${(values.amount / Math.max(maxCategoryAmount, 1)) * 100}%`,
                          backgroundColor: categoryColor(name),
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        <SectionHeading title="Top merchants" detail="By spend" />
        <View style={styles.panel}>
          {periodData.merchants.length === 0 ? (
            <Text style={styles.emptyText}>Merchant highlights will appear here after you add expenses.</Text>
          ) : (
            periodData.merchants.map((merchant, index) => (
              <View key={`${merchant.merchant}-${index}`} style={[styles.merchantItem, index > 0 && styles.itemDivider]}>
                <View style={styles.merchantRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.merchantDetails}>
                  <Text style={styles.merchantName} numberOfLines={1}>{merchant.merchant}</Text>
                  <Text style={styles.categoryMeta}>
                    {merchant.count} {merchant.count === 1 ? 'expense' : 'expenses'}
                  </Text>
                </View>
                <Text style={styles.categoryAmount}>{formatRupees(merchant.amount)}</Text>
              </View>
            ))
          )}
        </View>

        {transactions.length === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-expense')}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={19} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add your first expense</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.footer}>INSIGHTS FROM YOUR SAVED TRANSACTIONS · STORED ON THIS DEVICE</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 13 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 23 },
  eyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.35 },
  title: { color: COLORS.text, fontSize: 29, fontWeight: '800', letterSpacing: -0.7, marginTop: 5 },
  headerIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#292435', borderWidth: 1, borderColor: '#3A3348', alignItems: 'center', justifyContent: 'center' },
  periodSwitch: { flexDirection: 'row', padding: 4, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, marginBottom: 17 },
  periodOption: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  periodOptionSelected: { backgroundColor: '#292435' },
  periodText: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  periodTextSelected: { color: '#D4C8FF' },
  summaryCard: { padding: 18, borderRadius: 21, backgroundColor: COLORS.raised, borderWidth: 1, borderColor: '#2B2D39', marginBottom: 25 },
  budgetLinkCard: { padding: 15, borderRadius: 17, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginTop: -8, marginBottom: 24 },
  budgetLinkTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  budgetLinkEyebrow: { color: COLORS.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.9 },
  budgetLinkAmount: { color: COLORS.text, fontSize: 15, fontWeight: '800', marginTop: 5 },
  budgetLinkOf: { color: COLORS.muted, fontSize: 10, fontWeight: '500' },
  budgetLinkIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#292435', alignItems: 'center', justifyContent: 'center' },
  budgetTrack: { height: 5, borderRadius: 5, backgroundColor: '#2A2C36', overflow: 'hidden', marginTop: 12 },
  budgetFill: { height: '100%', borderRadius: 5 },
  budgetLinkStatus: { color: COLORS.muted, fontSize: 9, marginTop: 7 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardEyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  totalAmount: { color: COLORS.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.8, marginTop: 7 },
  summaryIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: '#292435', alignItems: 'center', justifyContent: 'center' },
  summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  summaryStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statLabel: { color: COLORS.muted, fontSize: 9 },
  statValue: { color: COLORS.text, fontSize: 12, fontWeight: '700', marginTop: 5 },
  statSeparator: { height: 30, width: 1, backgroundColor: COLORS.border },
  changeStat: { alignItems: 'flex-end', maxWidth: 112 },
  positiveValue: { color: COLORS.teal },
  negativeValue: { color: COLORS.orange },
  neutralValue: { color: COLORS.muted },
  comparisonHint: { color: COLORS.muted, fontSize: 9, marginTop: 13 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  sectionDetail: { color: COLORS.muted, fontSize: 10 },
  panel: { paddingHorizontal: 15, paddingVertical: 4, borderRadius: 19, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  chart: { flexDirection: 'row', height: 153, paddingTop: 12, paddingBottom: 10 },
  chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartAmount: { color: COLORS.muted, fontSize: 7, height: 12, width: '100%', textAlign: 'center' },
  barArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-end', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  bar: { width: 13, maxHeight: 100, minHeight: 4, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  chartLabel: { color: COLORS.muted, fontSize: 8, marginTop: 7 },
  emptyText: { color: COLORS.muted, fontSize: 11, lineHeight: 17, paddingVertical: 15 },
  categoryItem: { paddingVertical: 13 },
  itemDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 10 },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  categoryName: { color: COLORS.text, fontSize: 11, fontWeight: '600', flexShrink: 1 },
  topTag: { color: COLORS.violet, backgroundColor: '#292435', overflow: 'hidden', fontSize: 7, fontWeight: '800', letterSpacing: 0.5, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 5 },
  categoryAmount: { color: COLORS.text, fontSize: 11, fontWeight: '700' },
  categoryMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, marginBottom: 7 },
  categoryMeta: { color: COLORS.muted, fontSize: 9 },
  track: { height: 4, backgroundColor: '#2A2C36', borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  merchantItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 11 },
  merchantRank: { width: 30, height: 30, borderRadius: 10, backgroundColor: COLORS.raised, alignItems: 'center', justifyContent: 'center' },
  rankText: { color: COLORS.violet, fontSize: 11, fontWeight: '800' },
  merchantDetails: { flex: 1 },
  merchantName: { color: COLORS.text, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, alignSelf: 'center', backgroundColor: COLORS.violet, paddingHorizontal: 17, paddingVertical: 12, borderRadius: 15, marginTop: 1, marginBottom: 18 },
  addButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  footer: { color: '#696D79', fontSize: 7, fontWeight: '700', letterSpacing: 0.8, textAlign: 'center', marginTop: 1, marginBottom: 8 },
});
