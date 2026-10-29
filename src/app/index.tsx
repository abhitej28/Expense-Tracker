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

const COLORS = {
  background: '#0B0F19',
  card: '#151B2B',
  border: '#252D40',
  text: '#F5F7FF',
  muted: '#929BB0',
  green: '#6EE7B7',
  purple: '#A78BFA',
  orange: '#FDBA74',
  red: '#FB7185',
};

const transactions = [
  {
    id: '1',
    merchant: 'Swiggy',
    category: 'Food & Dining',
    amount: 189,
    icon: 'fast-food-outline' as const,
    color: COLORS.orange,
    date: 'Today, 8:42 PM',
  },
  {
    id: '2',
    merchant: 'Uber',
    category: 'Transport',
    amount: 145,
    icon: 'car-outline' as const,
    color: COLORS.purple,
    date: 'Today, 5:20 PM',
  },
  {
    id: '3',
    merchant: 'Coffee Shop',
    category: 'Food & Dining',
    amount: 120,
    icon: 'cafe-outline' as const,
    color: COLORS.green,
    date: 'Today, 11:15 AM',
  },
  {
    id: '4',
    merchant: 'Amazon',
    category: 'Shopping',
    amount: 799,
    icon: 'bag-outline' as const,
    color: COLORS.red,
    date: 'Yesterday',
  },
];

const totalSpent = transactions.reduce(
  (total, transaction) => total + transaction.amount,
  0
);

const monthlyBudget = 15000;
const remainingBudget = monthlyBudget - totalSpent;
const budgetUsed = (totalSpent / monthlyBudget) * 100;

function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 120 },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>YOUR MONEY, YOUR CONTROL</Text>
            <Text style={styles.appName}>Pennywise</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            accessibilityLabel="Profile and settings"
            onPress={() => router.push('/explore')}
          >
            <Ionicons
              name="person-outline"
              size={22}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        {/* Monthly spending card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>TOTAL SPENT THIS MONTH</Text>
              <Text style={styles.totalAmount}>
                ₹{totalSpent.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.monthBadge}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={COLORS.green}
              />
              <Text style={styles.monthText}>October</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.budgetRow}>
            <View>
              <Text style={styles.secondaryLabel}>Monthly budget</Text>
              <Text style={styles.budgetValue}>
                ₹{monthlyBudget.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.remainingContainer}>
              <Text style={styles.secondaryLabel}>Remaining</Text>
              <Text style={styles.remainingValue}>
                ₹{remainingBudget.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(budgetUsed, 100)}%` },
              ]}
            />
          </View>

          <Text style={styles.progressCaption}>
            {budgetUsed.toFixed(1)}% of your monthly budget used
          </Text>
        </View>

        {/* Micro-leak insight */}
        <SectionHeading title="Your money leaks" />

        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Ionicons
              name="flash-outline"
              size={23}
              color={COLORS.orange}
            />
          </View>

          <View style={styles.insightBody}>
            <Text style={styles.insightTitle}>Small spends add up</Text>
            <Text style={styles.insightDescription}>
              Your purchases under ₹200 can quietly become a significant
              monthly expense. Track them to understand your spending habits.
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/explore')}
              accessibilityRole="button"
            >
              <Text style={styles.insightAction}>Explore insights →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spending categories */}
        <SectionHeading title="Spending breakdown" action="This month" />

        <View style={styles.categoryCard}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryLeft}>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: '#33281F' },
                ]}
              >
                <Ionicons
                  name="fast-food-outline"
                  size={19}
                  color={COLORS.orange}
                />
              </View>
              <View>
                <Text style={styles.categoryName}>Food & Dining</Text>
                <Text style={styles.categorySub}>2 transactions</Text>
              </View>
            </View>
            <Text style={styles.categoryAmount}>₹309</Text>
          </View>

          <View style={styles.categoryTrack}>
            <View
              style={[
                styles.categoryFill,
                {
                  width: `${(309 / totalSpent) * 100}%`,
                  backgroundColor: COLORS.orange,
                },
              ]}
            />
          </View>

          <View style={styles.categoryRow}>
            <View style={styles.categoryLeft}>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: '#29233D' },
                ]}
              >
                <Ionicons
                  name="car-outline"
                  size={19}
                  color={COLORS.purple}
                />
              </View>
              <View>
                <Text style={styles.categoryName}>Transport</Text>
                <Text style={styles.categorySub}>1 transaction</Text>
              </View>
            </View>
            <Text style={styles.categoryAmount}>₹145</Text>
          </View>

          <View style={styles.categoryTrack}>
            <View
              style={[
                styles.categoryFill,
                {
                  width: `${(145 / totalSpent) * 100}%`,
                  backgroundColor: COLORS.purple,
                },
              ]}
            />
          </View>

          <View style={styles.categoryRow}>
            <View style={styles.categoryLeft}>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: '#3B202B' },
                ]}
              >
                <Ionicons
                  name="bag-outline"
                  size={19}
                  color={COLORS.red}
                />
              </View>
              <View>
                <Text style={styles.categoryName}>Shopping</Text>
                <Text style={styles.categorySub}>1 transaction</Text>
              </View>
            </View>
            <Text style={styles.categoryAmount}>₹799</Text>
          </View>

          <View style={styles.categoryTrack}>
            <View
              style={[
                styles.categoryFill,
                {
                  width: `${(799 / totalSpent) * 100}%`,
                  backgroundColor: COLORS.red,
                },
              ]}
            />
          </View>
        </View>

        {/* Recent transactions */}
        <SectionHeading title="Recent transactions" action="View all" />

        <View style={styles.transactionsCard}>
          {transactions.map((transaction, index) => (
            <View
              key={transaction.id}
              style={[
                styles.transactionRow,
                index !== transactions.length - 1 &&
                  styles.transactionBorder,
              ]}
            >
              <View
                style={[
                  styles.transactionIcon,
                  { backgroundColor: '#20283A' },
                ]}
              >
                <Ionicons
                  name={transaction.icon}
                  size={21}
                  color={transaction.color}
                />
              </View>

              <View style={styles.transactionDetails}>
                <Text style={styles.merchantName}>
                  {transaction.merchant}
                </Text>
                <Text style={styles.transactionMeta}>
                  {transaction.category} · {transaction.date}
                </Text>
              </View>

              <Text style={styles.transactionAmount}>
                -₹{transaction.amount.toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
        </View>
        {/* Add expense button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-expense')}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={22} color="#0B0F19" />
          <Text style={styles.addButtonText}>Add an expense</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Demonstration data only · Not connected to your bank
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  greeting: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  appName: {
    color: COLORS.text,
    fontSize: 29,
    fontWeight: '800',
    marginTop: 5,
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    padding: 22,
    borderRadius: 25,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 29,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  totalAmount: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: '800',
    marginTop: 10,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#20352F',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  monthText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 21,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  budgetValue: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 6,
  },
  remainingContainer: {
    alignItems: 'flex-end',
  },
  remainingValue: {
    color: COLORS.green,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 6,
  },
  progressTrack: {
    height: 7,
    borderRadius: 10,
    backgroundColor: '#30374A',
    overflow: 'hidden',
    marginTop: 22,
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: COLORS.green,
  },
  progressCaption: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 9,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    marginTop: 1,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionAction: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '600',
  },
  insightCard: {
    flexDirection: 'row',
    padding: 17,
    borderRadius: 21,
    backgroundColor: '#241F1B',
    borderWidth: 1,
    borderColor: '#453428',
    marginBottom: 29,
    gap: 13,
  },
  insightIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#3B2B1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightBody: {
    flex: 1,
  },
  insightTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 7,
  },
  insightDescription: {
    color: '#C2B8AD',
    fontSize: 12,
    lineHeight: 19,
  },
  insightAction: {
    color: COLORS.orange,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
  },
  categoryCard: {
    padding: 17,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 29,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 11,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  categorySub: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },
  categoryAmount: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  categoryTrack: {
    height: 4,
    backgroundColor: '#30374A',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  categoryFill: {
    height: '100%',
    borderRadius: 10,
  },
  transactionsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    marginBottom: 22,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 11,
  },
  transactionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transactionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  merchantName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  transactionMeta: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
  },
  transactionAmount: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    borderRadius: 17,
  },
  addButtonText: {
    color: '#0B0F19',
    fontSize: 14,
    fontWeight: '800',
  },
  disclaimer: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 17,
  },
});
