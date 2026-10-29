import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

const COLORS = {
  background: '#0B0F19',
  card: '#151B2B',
  border: '#252D40',
  text: '#F5F7FF',
  muted: '#929BB0',
  green: '#6EE7B7',
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

export default function AddExpenseScreen() {
  const router = useRouter();
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Allow only digits and up to 2 decimal places
  const handleAmountChange = (text: string) => {
    if (/^\d*\.?\d{0,2}$/.test(text)) setAmount(text);
  };

  const handleSave = () => {
    if (!merchant.trim()) return setError('Please enter a merchant or description.');
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0)
      return setError('Please enter an amount greater than zero.');
    if (!category) return setError('Please choose a category.');

    setError('');
    // TODO (Phase 3): save the transaction to local storage
    console.log({ merchant: merchant.trim(), value, category, note });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Add an expense</Text>
            <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Close">
              <Ionicons name="close" size={26} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>MERCHANT OR DESCRIPTION</Text>
          <TextInput
            style={styles.input}
            value={merchant}
            onChangeText={setMerchant}
            placeholder="e.g. Sharma Stores"
            placeholderTextColor={COLORS.muted}
          />

          <Text style={styles.label}>AMOUNT (₹)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={handleAmountChange}
            placeholder="0.00"
            placeholderTextColor={COLORS.muted}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => {
              const selected = c === category;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>NOTE (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={note}
            onChangeText={setNote}
            placeholder="Anything to remember?"
            placeholderTextColor={COLORS.muted}
            multiline
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Save expense</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  label: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: COLORS.text,
    fontSize: 15,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  chipText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: COLORS.background },
  error: { color: COLORS.red, fontSize: 12, marginTop: 16 },
  saveButton: {
    backgroundColor: COLORS.green,
    borderRadius: 17,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveText: { color: COLORS.background, fontSize: 14, fontWeight: '800' },
});