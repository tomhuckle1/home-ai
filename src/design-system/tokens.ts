export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  largeTitle: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const },
  title1: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  title2: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
} as const;

// Warm, calm, trustworthy — closer to Apple Health/Wallet than an
// enterprise dashboard. One accent colour, restrained semantic colours.
const palette = {
  green50: '#EAF3EC',
  green100: '#CFE6D6',
  green500: '#2F6F4E',
  green600: '#255A3F',
  green700: '#1B4530',
  amber100: '#FBE8C6',
  amber500: '#B8790A',
  red100: '#F6D9D6',
  red500: '#B23B32',
  neutral0: '#FFFFFF',
  neutral50: '#F9F8F5',
  neutral100: '#F5F3EE',
  neutral200: '#E9E5DC',
  neutral300: '#D8D3C6',
  neutral500: '#8C8677',
  neutral700: '#54503F',
  neutral800: '#3A3730',
  neutral900: '#211F1A',
  black: '#000000',
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentStrong: string;
  onAccent: string;
  accentMuted: string;
  warning: string;
  warningMuted: string;
  danger: string;
  dangerMuted: string;
  overlay: string;
  tabBarInactive: string;
}

export const lightColors: ThemeColors = {
  background: palette.neutral100,
  surface: palette.neutral0,
  surfaceAlt: palette.neutral50,
  border: palette.neutral200,
  textPrimary: palette.neutral900,
  textSecondary: palette.neutral700,
  textTertiary: palette.neutral500,
  accent: palette.green500,
  accentStrong: palette.green600,
  onAccent: palette.neutral0,
  accentMuted: palette.green50,
  warning: palette.amber500,
  warningMuted: palette.amber100,
  danger: palette.red500,
  dangerMuted: palette.red100,
  overlay: 'rgba(33, 31, 26, 0.5)',
  tabBarInactive: palette.neutral500,
};

export const darkColors: ThemeColors = {
  background: palette.neutral900,
  surface: palette.neutral800,
  surfaceAlt: '#2B2822',
  border: '#4A4638',
  textPrimary: palette.neutral0,
  textSecondary: palette.neutral300,
  textTertiary: palette.neutral500,
  accent: palette.green100,
  accentStrong: palette.neutral0,
  onAccent: palette.green700,
  accentMuted: palette.green700,
  warning: palette.amber100,
  warningMuted: palette.green700,
  danger: palette.red100,
  dangerMuted: '#4A2620',
  overlay: 'rgba(0, 0, 0, 0.6)',
  tabBarInactive: palette.neutral500,
};
