import { StyleSheet, Platform, StatusBar } from 'react-native';
import { DrawerTheme } from '../constants/DrawerTheme';

export const styles = StyleSheet.create({
  scrollContent: { 
    padding: 20, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60, 
    paddingBottom: 100 
  },
  
  // 헤더 섹션
  header: { 
    backgroundColor: DrawerTheme.woodDark, 
    borderRadius: 12, 
    padding: 25, 
    marginBottom: 25, 
    borderWidth: 1.5, 
    borderColor: DrawerTheme.woodFrame, 
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 }
    })
  },
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  icon: { fontSize: 32 },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: DrawerTheme.goldBrass, 
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Cochin' : 'serif'
  },
  headerDivider: { 
    width: 40, 
    height: 2, 
    backgroundColor: DrawerTheme.goldBrass, 
    marginVertical: 10 
  },
  subtitle: { 
    fontSize: 13, 
    color: DrawerTheme.woodLight 
  },

  // 공통 섹션 레이아웃
  section: { marginBottom: 15 },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: DrawerTheme.goldBrass, 
    marginBottom: 12, 
    marginLeft: 5 
  },

  // 정보 표시 카드 (내 정보)
  infoCard: { 
    backgroundColor: 'rgba(28, 25, 23, 0.6)', 
    borderRadius: 12, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(212, 175, 55, 0.2)' 
  },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 8 
  },
  infoLabel: { 
    color: DrawerTheme.woodLight, 
    fontSize: 14 
  },
  infoValue: { 
    color: 'white', 
    fontWeight: '600', 
    fontSize: 14 
  },
  divider: { 
    height: 1, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    marginVertical: 4 
  },

  // 메뉴 버튼 (아코디언 헤더)
  menuButton: { 
    backgroundColor: 'rgba(28, 25, 23, 0.6)', 
    borderRadius: 12, 
    padding: 18, 
    borderWidth: 1, 
    borderColor: 'rgba(212, 175, 55, 0.2)' 
  },
  menuButtonText: { 
    color: DrawerTheme.goldBrass, 
    fontSize: 15, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  menuButtonDanger: { 
    backgroundColor: 'rgba(255, 107, 107, 0.1)', 
    borderRadius: 12, 
    padding: 18, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 107, 107, 0.3)' 
  },
  menuButtonTextDanger: { 
    color: '#ff6b6b', 
    fontSize: 15, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },

  // 입력 폼 카드 (내부)
  formCard: { 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    borderRadius: 12, 
    padding: 18, 
    marginTop: 10, 
    borderWidth: 1, 
    borderColor: 'rgba(212, 175, 55, 0.1)' 
  },
  formCardDanger: { 
    backgroundColor: 'rgba(255, 107, 107, 0.05)', 
    borderRadius: 12, 
    padding: 18, 
    marginTop: 10, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 107, 107, 0.2)' 
  },
  innerTitle: { 
    color: DrawerTheme.goldBrass, 
    fontSize: 13, 
    fontWeight: 'bold', 
    marginBottom: 15 
  },

  // 입력 필드 (TextInput)
  input: { 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    borderRadius: 8, 
    padding: 14, 
    color: 'white', 
    fontSize: 14,
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)' 
  },
  textArea: { 
    minHeight: 100, 
    marginTop: 10,
    textAlignVertical: 'top'
  },
  inputDanger: { 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    borderRadius: 8, 
    padding: 14, 
    color: 'white', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 107, 107, 0.3)' 
  },
  dangerText: { 
    color: '#ff6b6b', 
    fontSize: 12, 
    marginBottom: 15, 
    textAlign: 'center',
    lineHeight: 18
  },

  // 카테고리 선택 버튼 (버그 리포트용)
  categoryRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: 15 
  },
  categoryButton: { 
    flex: 1, 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  categoryButtonActive: { 
    borderColor: DrawerTheme.goldBrass, 
    backgroundColor: 'rgba(212, 175, 55, 0.1)' 
  },
  categoryButtonText: { 
    color: '#888', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  categoryButtonTextActive: {
    color: DrawerTheme.goldBrass
  },

  // 내부 구분선
  sectionDivider: { 
    height: 1, 
    backgroundColor: 'rgba(212,175,55,0.1)', 
    marginVertical: 20 
  },

  // 접수 내역 리스트 아이템
  historyCard: { 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    borderRadius: 8, 
    padding: 14, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  historyHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  historyType: { 
    fontSize: 11, 
    color: DrawerTheme.woodLight 
  },
  statusBadge: { 
    borderWidth: 1, 
    borderRadius: 6, 
    paddingHorizontal: 8, 
    paddingVertical: 2 
  },
  statusText: { 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  historyTitle: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '600',
    marginBottom: 6
  },
  historyDate: { 
    fontSize: 11, 
    color: '#888' 
  },
  emptyText: { 
    color: DrawerTheme.woodLight, 
    textAlign: 'center', 
    fontSize: 13, 
    paddingVertical: 20,
    fontStyle: 'italic'
  },

  // ✅ 관리자 답변 박스 스타일 추가
  adminResponseBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  adminResponseLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: DrawerTheme.goldBrass,
    marginBottom: 6,
  },
  adminResponseText: {
    fontSize: 13,
    color: '#DDD',
    lineHeight: 20,
  },

  // 앱 버전 정보
  appInfo: { 
    marginTop: 40, 
    alignItems: 'center' 
  },
  appInfoText: { 
    color: '#666', 
    fontSize: 11, 
    opacity: 0.6 
  }
});