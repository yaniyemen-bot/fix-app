import { useColorScheme } from 'react-native';

export interface Palette {
  dark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  border: string;
  borderSoft: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primarySoft: string;
  primaryText: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  headerGradient: [string, string];
  shadow: string;
  overlay: string;
  inputBg: string;
}

const light: Palette = {
  dark: false,
  bg: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderSoft: '#EEF2F7',
  text: '#0F172A',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  primary: '#0F766E',
  primarySoft: '#DCF3F0',
  primaryText: '#0B5A54',
  accent: '#B45309',
  accentSoft: '#FEF3C7',
  success: '#059669',
  successSoft: '#D1FAE5',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#2563EB',
  infoSoft: '#DBEAFE',
  headerGradient: ['#0F766E', '#115E59'],
  shadow: '#0F172A',
  overlay: 'rgba(15,23,42,0.45)',
  inputBg: '#F8FAFC',
};

const dark: Palette = {
  dark: true,
  bg: '#0B1220',
  surface: '#121B2E',
  surfaceAlt: '#16213A',
  card: '#141E33',
  border: '#22304D',
  borderSoft: '#1B2740',
  text: '#E8EEF9',
  textMuted: '#94A3B8',
  textFaint: '#64748B',
  primary: '#2DD4BF',
  primarySoft: '#123A38',
  primaryText: '#7FF3E4',
  accent: '#FBBF24',
  accentSoft: '#3A2E12',
  success: '#34D399',
  successSoft: '#12352A',
  warning: '#FBBF24',
  warningSoft: '#3A2E12',
  danger: '#F87171',
  dangerSoft: '#3A1B1B',
  info: '#60A5FA',
  infoSoft: '#152A47',
  headerGradient: ['#123A38', '#0E2A33'],
  shadow: '#000000',
  overlay: 'rgba(2,6,23,0.7)',
  inputBg: '#0F1829',
};

export function usePalette(): Palette {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

export const lightPalette = light;
export const darkPalette = dark;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};
