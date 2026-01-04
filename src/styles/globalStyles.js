import { StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

// 공통 스타일 베이스
const baseCard = { backgroundColor: Colors.purpleMid, borderRadius: 20, padding: 25, marginBottom: 20, borderWidth: 3 };
const baseInput = { backgroundColor: 'rgba(138, 43, 226, 0.1)', borderWidth: 2, borderRadius: 10, padding: 15, fontSize: 16, color: 'white' };
const baseBadge = { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 2 };

export const globalStyles = StyleSheet.create({
  // 컨테이너 & 레이아웃
  container: { flex: 1, backgroundColor: Colors.purpleDark },
  containerPadding: { flex: 1, padding: 20, backgroundColor: Colors.purpleDark },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  center: { justifyContent: 'center', alignItems: 'center' },

  // 카드
  card: { ...baseCard, borderColor: Colors.purpleLight },
  cardGold: { ...baseCard, borderColor: Colors.gold, shadowColor: Colors.gold, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },

  // 텍스트
  title: { fontSize: 32, fontWeight: '700', color: Colors.gold, marginBottom: 10 },
  subtitle: { fontSize: 16, color: Colors.lavender, marginBottom: 20 },
  bodyText: { fontSize: 16, color: 'white', lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.gold, marginBottom: 8 },

  // 입력 필드
  input: { ...baseInput, borderColor: Colors.purpleLight },
  textarea: { ...baseInput, borderColor: Colors.purpleLight, minHeight: 100, textAlignVertical: 'top' },

  // 버튼
  button: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10, borderWidth: 2, ...this.center, minHeight: 50 },
  buttonPrimary: { borderColor: Colors.gold },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },

  // 배지 (배경색은 컴포넌트에서 직접 rgba 조합 권장)
  badge: baseBadge,
  badgeGold: { ...baseBadge, backgroundColor: 'rgba(255, 215, 0, 0.3)', borderColor: Colors.gold },
  badgeGreen: { ...baseBadge, backgroundColor: 'rgba(76, 175, 80, 0.3)', borderColor: Colors.green },

  // 유틸리티 (마진/패딩)
  marginB20: { marginBottom: 20 },
  paddingH20: { paddingHorizontal: 20 },

  // 메시지 & 상태
  emptyContainer: { ...baseCard, borderColor: Colors.purpleLight, alignItems: 'center', padding: 60 },
  messageContainer: { padding: 15, borderRadius: 10, marginTop: 15, borderWidth: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});