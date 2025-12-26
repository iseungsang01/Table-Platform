import { StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

/**
 * 전역 스타일
 * 앱 전체에서 재사용 가능한 공통 스타일
 */
export const globalStyles = StyleSheet.create({
  // 컨테이너
  container: {
    flex: 1,
    backgroundColor: Colors.purpleDark,
  },
  containerPadding: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100, // 하단 네비게이션 공간 확보
  },

  // 카드
  card: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
  },
  cardGold: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  // 텍스트
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 10,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lavender,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 15,
  },
  bodyText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 24,
  },
  smallText: {
    fontSize: 14,
    color: Colors.lavender,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 8,
  },

  // 입력 필드
  input: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
  },
  inputFocused: {
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  textarea: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // 버튼
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonPrimary: {
    borderColor: Colors.gold,
  },
  buttonSecondary: {
    borderColor: Colors.purpleLight,
  },
  buttonDanger: {
    borderColor: Colors.redSoft,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  // 배지
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
  },
  badgeGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: Colors.gold,
  },
  badgePurple: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderColor: Colors.purpleLight,
  },
  badgeGreen: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderColor: Colors.green,
  },
  badgeRed: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    borderColor: Colors.redSoft,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // 레이아웃
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 간격
  marginBottom10: { marginBottom: 10 },
  marginBottom15: { marginBottom: 15 },
  marginBottom20: { marginBottom: 20 },
  marginTop10: { marginTop: 10 },
  marginTop15: { marginTop: 15 },
  marginTop20: { marginTop: 20 },
  paddingHorizontal10: { paddingHorizontal: 10 },
  paddingHorizontal15: { paddingHorizontal: 15 },
  paddingHorizontal20: { paddingHorizontal: 20 },
  paddingVertical10: { paddingVertical: 10 },
  paddingVertical15: { paddingVertical: 15 },
  paddingVertical20: { paddingVertical: 20 },

  // 그림자
  shadow: {
    shadowColor: Colors.purpleLight,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  shadowGold: {
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  // 경계선
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.purpleLight,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: Colors.purpleLight,
  },

  // 빈 상태
  emptyContainer: {
    alignItems: 'center',
    padding: 60,
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.lavender,
    textAlign: 'center',
  },

  // 메시지
  messageContainer: {
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    borderWidth: 2,
  },
  messageSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderColor: Colors.green,
  },
  messageError: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderColor: Colors.errorRed,
  },
  messageInfo: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderColor: '#2196f3',
  },
  messageText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  // 로딩
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: Colors.lavender,
    fontSize: 16,
    marginTop: 10,
  },
});