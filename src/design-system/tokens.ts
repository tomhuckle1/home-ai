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

// Crisp, white-forward, modern SaaS-clean — closer to Linear/Stripe than
// the earlier warm-earthy Apple Health direction. Predominantly white
// surfaces, structure from thin grey borders and soft shadows rather than
// colour blocking, one confident accent.
const palette = {
  emerald50: '#ECFDF5',
  emerald400: '#34D399',
  emerald600: '#059669',
  emerald700: '#047857',
  emeraldDark: '#022C1E',
  amber50: '#FFFBEB',
  amber400: '#FBBF24',
  amber600: '#D97706',
  amberDark: '#3A2400',
  red50: '#FEF2F2',
  red400: '#F87171',
  red600: '#DC2626',
  redDark: '#450A0A',
  white: '#FFFFFF',
  grey25: '#FCFCFD',
  grey50: '#F7F7F8',
  grey100: '#EFEFF1',
  grey200: '#E4E4E7',
  grey400: '#A1A1AA',
  grey450: '#8B8B93',
  grey500: '#71717A',
  grey600: '#52525B',
  grey900: '#111113',
  zinc900: '#0A0A0B',
  zinc850: '#151517',
  zinc800: '#1C1C1F',
  zinc700: '#27272A',
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
  background: palette.white,
  surface: palette.white,
  surfaceAlt: palette.grey50,
  border: palette.grey200,
  textPrimary: palette.grey900,
  textSecondary: palette.grey600,
  // grey500, not grey400 — grey400 on white is ~2.6:1, below WCAG AA for
  // the caption/footnote text this color is actually used for.
  textTertiary: palette.grey500,
  accent: palette.emerald600,
  accentStrong: palette.emerald700,
  onAccent: palette.white,
  accentMuted: palette.emerald50,
  warning: palette.amber600,
  warningMuted: palette.amber50,
  danger: palette.red600,
  dangerMuted: palette.red50,
  overlay: 'rgba(17, 17, 19, 0.5)',
  tabBarInactive: palette.grey400,
};

export const darkColors: ThemeColors = {
  background: palette.zinc900,
  surface: palette.zinc850,
  surfaceAlt: palette.zinc800,
  border: palette.zinc700,
  textPrimary: palette.grey25,
  textSecondary: palette.grey400,
  // Distinct from textSecondary while still ~5.9:1 against the dark background.
  textTertiary: palette.grey450,
  accent: palette.emerald400,
  accentStrong: palette.white,
  onAccent: palette.emeraldDark,
  accentMuted: '#0C2D22',
  warning: palette.amber400,
  warningMuted: palette.amberDark,
  danger: palette.red400,
  dangerMuted: palette.redDark,
  overlay: 'rgba(0, 0, 0, 0.7)',
  tabBarInactive: palette.grey500,
};
