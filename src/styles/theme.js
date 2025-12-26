import { Colors, Gradients } from '../constants/Colors';

/**
 * 앱 테마 설정
 * 디자인 시스템의 중앙 설정
 */

/**
 * 타이포그래피
 */
export const typography = {
  // 폰트 크기
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },
  
  // 폰트 두께
  fontWeight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  
  // 줄 간격
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

/**
 * 간격
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

/**
 * 둥글기
 */
export const borderRadius = {
  none: 0,
  sm: 5,
  base: 10,
  md: 15,
  lg: 20,
  full: 9999,
};

/**
 * 테두리
 */
export const borderWidth = {
  none: 0,
  thin: 1,
  base: 2,
  thick: 3,
};

/**
 * 그림자
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: Colors.purpleLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  base: {
    shadowColor: Colors.purpleLight,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  md: {
    shadowColor: Colors.purpleLight,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  lg: {
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 60,
    elevation: 20,
  },
  gold: {
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
};

/**
 * 애니메이션 지속 시간
 */
export const duration = {
  fastest: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  slowest: 800,
};

/**
 * 불투명도
 */
export const opacity = {
  disabled: 0.5,
  medium: 0.7,
  high: 0.9,
  full: 1,
};

/**
 * z-index 레벨
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600,
};

/**
 * 컴포넌트별 테마
 */
export const components = {
  // 버튼
  button: {
    height: 50,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.base,
    borderWidth: borderWidth.base,
  },
  
  // 입력 필드
  input: {
    height: 50,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.base,
    borderWidth: borderWidth.base,
    fontSize: typography.fontSize.base,
  },
  
  // 카드
  card: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: borderWidth.thick,
  },
  
  // 배지
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: borderWidth.base,
    fontSize: typography.fontSize.xs,
  },
  
  // 탭 바
  tabBar: {
    height: 60,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: borderWidth.base,
  },
};

/**
 * 레이아웃 상수
 */
export const layout = {
  maxWidth: 1200,
  minHeight: {
    button: 44,
    input: 44,
    touchTarget: 44,
  },
  bottomTabHeight: 60,
  bottomTabHeightIOS: 85,
};

/**
 * 전체 테마 객체
 */
export const theme = {
  colors: Colors,
  gradients: Gradients,
  typography,
  spacing,
  borderRadius,
  borderWidth,
  shadows,
  duration,
  opacity,
  zIndex,
  components,
  layout,
};

export default theme;