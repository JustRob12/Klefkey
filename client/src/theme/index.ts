import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 375;

// Responsive font scaling helper with scale clamping for optimal readability on all phones
export const rf = (size: number): number => {
  const clampedScale = Math.min(Math.max(scale, 0.85), 1.25);
  return Math.round(size * clampedScale);
};

export const theme = {
  fonts: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },
};

export const lightColors = {
  background: '#ffffff',
  card: '#f8f9fa',
  cardSecondary: '#f1f3f5',
  border: '#e9ecef',
  cardBorder: '#e9ecef',
  primary: '#09090b',
  primaryForeground: '#ffffff',
  secondary: '#495057',
  text: '#09090b',
  textSecondary: '#495057',
  textMuted: '#868e96',
  inputBg: '#f1f3f5',
  inputBorder: '#dee2e6',
  danger: '#ef4444',
  dangerBg: 'rgba(239, 68, 68, 0.08)',
  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.08)',
  warning: '#f59e0b',
  badgeBg: '#e9ecef',
  tabBarBg: 'rgba(255, 255, 255, 0.96)',
  activeIndicator: '#09090b',
};

export const darkColors = {
  background: '#09090b',
  card: '#18181b',
  cardSecondary: '#27272a',
  border: '#27272a',
  cardBorder: '#27272a',
  primary: '#ffffff',
  primaryForeground: '#09090b',
  secondary: '#a1a1aa',
  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  inputBg: 'rgba(255, 255, 255, 0.05)',
  inputBorder: '#3f3f46',
  danger: '#f87171',
  dangerBg: 'rgba(248, 113, 113, 0.15)',
  success: '#34d399',
  successBg: 'rgba(52, 211, 153, 0.15)',
  warning: '#fbbf24',
  badgeBg: '#27272a',
  tabBarBg: 'rgba(24, 24, 27, 0.92)',
  activeIndicator: '#ffffff',
};

export type ColorsType = typeof darkColors;
