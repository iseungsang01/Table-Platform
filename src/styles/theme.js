import { Colors, Gradients } from '../constants/Colors';

// 헬퍼: 반복되는 그림자 객체 생성을 단순화
const createShadow = (color, height, opacity, radius, elevation) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

export const typography = {
  fontSize: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 28, '4xl': 32, '5xl': 36 },
  fontWeight: { regular: '400', medium: '500', semiBold: '600', bold: '700' },
  lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.8 },
};

export const spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 40, '4xl': 48 };

export const borderRadius = { none: 0, sm: 5, base: 10, md: 15, lg: 20, full: 9999 };

export const borderWidth = { none: 0, thin: 1, base: 2, thick: 3 };

export const shadows = {
  none: createShadow('transparent', 0, 0, 0, 0),
  sm: createShadow(Colors.purpleLight, 2, 0.2, 4, 2),
  base: createShadow(Colors.purpleLight, 5, 0.3, 10, 5),
  md: createShadow(Colors.purpleLight, 10, 0.3, 20, 10),
  lg: createShadow(Colors.gold, 20, 0.3, 60, 20),
  gold: createShadow(Colors.gold, 10, 0.5, 20, 15),
};

export const duration = { fastest: 100, fast: 200, normal: 300, slow: 500, slowest: 800 };

export const opacity = { disabled: 0.5, medium: 0.7, high: 0.9, full: 1 };

export const zIndex = { base: 0, dropdown: 1000, sticky: 1100, modal: 1300, popover: 1400, toast: 1500, tooltip: 1600 };

export const components = {
  button: { height: 50, paddingHorizontal: spacing.xl, paddingVertical: spacing.base, borderRadius: borderRadius.base, borderWidth: borderWidth.base },
  input: { height: 50, paddingHorizontal: spacing.base, borderRadius: borderRadius.base, borderWidth: borderWidth.base, fontSize: typography.fontSize.base },
  card: { paddingHorizontal: spacing.xl, paddingVertical: spacing.xl, borderRadius: borderRadius.lg, borderWidth: borderWidth.thick },
  badge: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full, borderWidth: borderWidth.base, fontSize: typography.fontSize.xs },
  tabBar: { height: 60, paddingTop: spacing.sm, paddingBottom: spacing.sm, borderTopWidth: borderWidth.base },
};

export const layout = {
  maxWidth: 1200,
  minHeight: { button: 44, input: 44, touchTarget: 44 },
  bottomTabHeight: 60,
  bottomTabHeightIOS: 85,
};

export const theme = { colors: Colors, gradients: Gradients, typography, spacing, borderRadius, borderWidth, shadows, duration, opacity, zIndex, components, layout };

export default theme;