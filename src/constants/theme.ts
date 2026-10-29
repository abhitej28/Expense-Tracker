/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B1F18',
    background: '#F3F8F5',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E0EDE6',
    textSecondary: '#5A6F66',
    card: '#FFFFFF',
    border: '#D5E4DB',
    track: '#DCE8E1',
    accent: '#A3E635',
    accentText: '#0B1F18',
    positive: '#059669',
    warning: '#D97706',
    danger: '#E11D48',
    purple: '#7C3AED',
  },
  dark: {
    text: '#F2FBF7',
    background: '#06120E',
    backgroundElement: '#0E1F19',
    backgroundSelected: '#16322A',
    textSecondary: '#8FAA9F',
    card: '#0E1F19',
    border: '#1C3A30',
    track: '#1F3A31',
    accent: '#B6F34A',
    accentText: '#06120E',
    positive: '#34D399',
    warning: '#FDBA74',
    danger: '#FB7185',
    purple: '#A78BFA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type AppColors = Record<keyof typeof Colors.light, string>;
export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
