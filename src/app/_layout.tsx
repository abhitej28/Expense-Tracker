import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { BudgetsProvider } from '@/context/budgets';
import { TransactionsProvider } from '@/context/transactions';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <TransactionsProvider>
        <BudgetsProvider>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="add-expense" options={{ presentation: 'modal' }} />
            <Stack.Screen name="transactions" options={{ presentation: 'modal' }} />
            <Stack.Screen name="budgets" options={{ presentation: 'modal' }} />
          </Stack>
        </BudgetsProvider>
      </TransactionsProvider>
    </ThemeProvider>
  );
}
