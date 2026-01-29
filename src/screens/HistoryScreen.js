import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, Platform, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVisits } from '../hooks/useVisits';

// 컴포넌트 및 테마
import { GradientBackground } from '../components/GradientBackground';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { DrawerChest } from '../components/DrawerChest';
import { DrawerUnit } from '../components/DrawerUnit';
import { TarotCardModal } from '../components/TarotCardModal';
import { DrawerTheme } from '../constants/DrawerTheme';

// 서비스 및 유틸리티
import { useAuth } from '../hooks/useAuth';
import { visitService } from '../services/visitService';
import { couponService } from '../services/couponService';
import { handleApiCall, showSuccessAlert } from '../utils/errorHandler';

const LOCAL_STORAGE_KEY = 'offline_visit_history';

const HistoryScreen = ({ navigation }) => {
  const { customer, refreshCustomer } = useAuth();
  /* React Query Hook 적용 */
  const { visits: serverVisits, isLoading: isVisitsLoading, refetch, deleteVisit } = useVisits(customer?.id);

  /* 기존 로컬 상태 */
  const [personalNotes, setPersonalNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [couponCount, setCouponCount] = useState(0);
  const [archiveMode, setArchiveMode] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [stats, setStats] = useState({
    current_stamps: customer?.current_stamps || 0,
    visit_count: customer?.visit_count || 0
  });

  /* 필터 관련 상태 */
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  /* 선택 모드 상태 */
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useFocusEffect(
    useCallback(() => {
      if (customer) {
        // 화면 포커스 시 데이터 새로고침 (React Query refetch + 로컬 데이터 + 통계)
        refreshAllData();
      }
    }, [customer])
  );

  const refreshAllData = async () => {
    try {
      await Promise.all([
        refetch(),
        loadLocalData(),
        loadStats(),
        loadCouponCount()
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  const loadLocalData = async () => {
    const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
    const localData = stored ? JSON.parse(stored) : [];
    const formattedNotes = localData.map(v => ({ ...v, is_manual: true }));
    setPersonalNotes(formattedNotes);
  };

  const loadStats = async () => {
    const { data: latestStats } = await handleApiCall(
      'HistoryScreen.loadStats',
      () => visitService.getCustomerStats(customer.id),
      { showAlert: false }
    );
    if (latestStats) {
      setStats({
        current_stamps: latestStats.current_stamps,
        visit_count: latestStats.visit_count
      });
    }
  };

  const loadCouponCount = async () => {
    try {
      const { count, error } = await couponService.getValidCouponCount(customer.id);
      if (error) {
        console.error("쿠폰 조회 에러:", error);
        return;
      }
      if (typeof count === 'number') {
        setCouponCount(count);
      } else {
        setCouponCount(0);
      }
    } catch (err) {
      console.error("loadCouponCount 실행 중 오류:", err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAllData();
    setRefreshing(false);
  };

  /**
   * ✅ 단일 삭제 로직 (캐시 무효화 추가)
   */
  const handleDeleteVisit = async (visitId) => {
    try {
      console.log('🗑️ [HistoryScreen] 삭제 요청:', { visitId, selectedItem });

      let itemToDelete = selectedItem;
      if (!itemToDelete) {
        const displayData = getDisplayData();
        itemToDelete = displayData.find(v => v.id === visitId);
      }

      if (!itemToDelete) {
        console.error('❌ 삭제할 항목을 찾을 수 없습니다:', visitId);
        Alert.alert('오류', '삭제할 항목을 찾을 수 없습니다.');
        return;
      }

      console.log('🔍 [HistoryScreen] 삭제 대상:', itemToDelete);

      if (itemToDelete.is_manual) {
        // 로컬 데이터 삭제
        const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
        const list = stored ? JSON.parse(stored) : [];
        const filtered = list.filter(v => v.id !== visitId);
        await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
        await loadLocalData(); // 로컬 리스트 갱신
      } else {
        // 서버 데이터 삭제 (React Query Mutation)
        await deleteVisit(visitId);
        await refreshCustomer();
      }

      showSuccessAlert('DELETE', Alert);
      setIsModalVisible(false);

    } catch (error) {
      Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
      console.error(error);
    }
  };

  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  /**
   * ✅ 롱프레스 핸들러 - 다중 선택 모드 진입
   */
  const handleLongPress = (visitId) => {
    console.log('🔒 [HistoryScreen] 롱프레스 감지:', visitId);

    // 선택 모드가 아니었다면 활성화
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds(new Set([visitId])); // 롱프레스한 항목을 첫 선택으로
    } else {
      // 이미 선택 모드라면 토글
      toggleSelection(visitId);
    }
  };

  /**
   * ✅ 다중 삭제 실행 (캐시 무효화 추가)
   */
  const handleMultiDelete = async () => {
    if (selectedIds.size === 0) {
      Alert.alert('선택 없음', '삭제할 항목을 선택해주세요.');
      return;
    }

    Alert.alert(
      '다중 삭제',
      `선택한 ${selectedIds.size}개의 서랍을 정말 비우시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ [HistoryScreen] 다중 삭제 시작');
              const displayData = getDisplayData();
              const serverIds = [];
              const localIds = [];

              selectedIds.forEach(id => {
                const item = displayData.find(v => v.id === id);
                if (item) {
                  if (item.is_manual) {
                    localIds.push(id);
                  } else {
                    serverIds.push(id);
                  }
                }
              });

              console.log('📊 [HistoryScreen] 삭제 대상:', { serverIds, localIds });

              // 서버 삭제
              const deletePromises = serverIds.map(id => deleteVisit(id));
              await Promise.all(deletePromises);

              // 로컬 삭제
              if (localIds.length > 0) {
                const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
                const list = stored ? JSON.parse(stored) : [];
                const filtered = list.filter(v => !localIds.includes(v.id));
                await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
                await loadLocalData();
              }

              showSuccessAlert('DELETE', Alert);
              setSelectedIds(new Set());
              setSelectionMode(false);

              if (serverIds.length > 0) await refreshCustomer();

            } catch (error) {
              console.error('❌ [HistoryScreen] 다중 삭제 오류:', error);
              Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const applyTimeFilter = (data) => {
    if (timeFilter === 'ALL') return data;

    return data.filter(item => {
      const date = new Date(item.visit_date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      if (timeFilter === 'YEAR') {
        return year === selectedYear;
      }
      if (timeFilter === 'MONTH') {
        return year === selectedYear && month === selectedMonth;
      }
      return true;
    });
  };

  const getDisplayData = () => {
    let data = [];
    const formattedServerVisits = serverVisits.map(v => ({ ...v, is_manual: false }));

    if (archiveMode === 'ON') data = formattedServerVisits;
    else if (archiveMode === 'OFF') data = personalNotes;
    else data = [...formattedServerVisits, ...personalNotes].sort((a, b) =>
      new Date(b.visit_date) - new Date(a.visit_date)
    );

    return applyTimeFilter(data);
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.title, { color: DrawerTheme.goldBrass }]}>
        {archiveMode === 'OFF' ? 'PRIVATE NOTES' : 'TAROT ARCHIVE'}
      </Text>

      <View style={[styles.brassBoard, { backgroundColor: DrawerTheme.woodDark, borderColor: DrawerTheme.woodFrame }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: DrawerTheme.woodLight }]}>스탬프</Text>
          <Text style={styles.statValue}>{stats.current_stamps}/10</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: DrawerTheme.woodFrame }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: DrawerTheme.woodLight }]}>방문 횟수</Text>
          <Text style={styles.statValue}>{stats.visit_count}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: DrawerTheme.woodFrame }]} />
        <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('Coupon')}>
          <Text style={[styles.statLabel, { color: DrawerTheme.woodLight }]}>보유 쿠폰</Text>
          <Text style={[styles.statValue, { color: DrawerTheme.goldBright }]}>{couponCount}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.tabContainer, { borderColor: DrawerTheme.woodFrame }]}>
        {[
          { id: 'ON', label: 'ON', color: DrawerTheme.woodMid },
          { id: 'OFF', label: 'OFF', color: DrawerTheme.navyMid },
          { id: 'ALL', label: 'ALL', color: DrawerTheme.goldBrass }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setArchiveMode(tab.id)}
            style={[styles.tabButton, archiveMode === tab.id && { backgroundColor: tab.color, borderColor: DrawerTheme.goldBright }]}
          >
            <Text style={[styles.tabLabel, archiveMode === tab.id && styles.activeTabLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterSection}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, timeFilter === 'ALL' && styles.filterButtonActive]}
            onPress={() => setTimeFilter('ALL')}
          >
            <Text style={[styles.filterText, timeFilter === 'ALL' && styles.filterTextActive]}>전체</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, timeFilter === 'YEAR' && styles.filterButtonActive]}
            onPress={() => setTimeFilter('YEAR')}
          >
            <Text style={[styles.filterText, timeFilter === 'YEAR' && styles.filterTextActive]}>연도별</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, timeFilter === 'MONTH' && styles.filterButtonActive]}
            onPress={() => setTimeFilter('MONTH')}
          >
            <Text style={[styles.filterText, timeFilter === 'MONTH' && styles.filterTextActive]}>월별</Text>
          </TouchableOpacity>
        </View>

        {(timeFilter === 'YEAR' || timeFilter === 'MONTH') && (
          <View style={styles.yearSelector}>
            {getYearOptions().map(year => (
              <TouchableOpacity
                key={year}
                style={[styles.yearButton, selectedYear === year && styles.yearButtonActive]}
                onPress={() => setSelectedYear(year)}
              >
                <Text style={[styles.yearText, selectedYear === year && styles.yearTextActive]}>{year}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {timeFilter === 'MONTH' && (
          <View style={styles.monthSelector}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <TouchableOpacity
                key={month}
                style={[styles.monthButton, selectedMonth === month && styles.monthButtonActive]}
                onPress={() => setSelectedMonth(month)}
              >
                <Text style={[styles.monthText, selectedMonth === month && styles.monthTextActive]}>{month}월</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* ✅ 선택 모드일 때만 액션 영역 표시 */}
      {selectionMode && (
        <View style={styles.selectionControl}>
          <View style={styles.selectionActions}>
            <Text style={styles.selectedCount}>{selectedIds.size}개 선택됨</Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setSelectionMode(false);
                  setSelectedIds(new Set());
                }}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteAllButton}
                onPress={handleMultiDelete}
                disabled={selectedIds.size === 0}
              >
                <Text style={[styles.deleteAllText, selectedIds.size === 0 && styles.deleteAllTextDisabled]}>
                  🗑️ 선택 삭제
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ✅ 힌트 텍스트 (선택 모드가 아닐 때만) */}
      {!selectionMode && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>💡 서랍을 길게 누르면 다중 선택 모드로 진입합니다</Text>
        </View>
      )}
    </View>
  );

  const renderDrawerChest = () => {
    const displayData = getDisplayData();
    return (
      <DrawerChest isManualMode={archiveMode === 'OFF'} selectionMode={selectionMode}>
        {archiveMode === 'OFF' && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.manualAddDrawer, { backgroundColor: DrawerTheme.navyDark }]}
            onPress={() => navigation.navigate('VisitDetail', { mode: 'manual', is_manual: true })}
          >
            <Text style={[styles.manualAddText, { color: DrawerTheme.goldBrass }]}>+ 개인 메모 서랍 추가</Text>
          </TouchableOpacity>
        )}

        {displayData.length > 0 ? (
          displayData.map((item) => (
            <DrawerUnit
              key={`${item.is_manual ? 'off' : 'on'}-${item.id}`}
              visit={item}
              onSelectCard={() => {
                if (selectionMode) {
                  toggleSelection(item.id);
                } else {
                  setSelectedItem(item);
                  setIsModalVisible(true);
                }
              }}
              onLongPress={() => handleLongPress(item.id)}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(item.id)}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: DrawerTheme.woodLight }]}>
              {timeFilter !== 'ALL' ? '해당 기간에 기록이 없습니다.' : '아직 비어있는 서랍장입니다.'}
            </Text>
          </View>
        )}
      </DrawerChest>
    );
  };

  if (isVisitsLoading && !refreshing) return <GradientBackground><LoadingSpinner /></GradientBackground>;

  return (
    <GradientBackground>
      <FlatList
        data={[1]}
        renderItem={renderDrawerChest}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={DrawerTheme.goldBrass} />}
      />

      <TarotCardModal
        isVisible={isModalVisible}
        visit={selectedItem}
        onClose={() => setIsModalVisible(false)}
        onEdit={(id) => {
          setIsModalVisible(false);
          navigation.navigate('VisitDetail', {
            visitId: id,
            is_manual: selectedItem?.is_manual,
            mode: selectedItem?.is_manual ? 'manual' : 'server'
          });
        }}
        onDelete={handleDeleteVisit}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 80 },
  // 헤더 여백 축소
  header: { alignItems: 'center', paddingTop: 20, marginBottom: 10 },
  // 타이틀 크기 및 자간 축소
  title: { fontSize: 22, letterSpacing: 3, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Cochin' : 'serif' },
  // 보드 마진 및 패딩 축소
  brassBoard: { flexDirection: 'row', width: '92%', marginTop: 10, padding: 10, borderRadius: 8, borderWidth: 2, elevation: 10 },
  statBox: { alignItems: 'center', flex: 1 },
  // 스탯 폰트 축소
  statLabel: { fontSize: 9, marginBottom: 2, fontWeight: 'bold' },
  statValue: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  divider: { width: 1, height: 25 },
  // 탭 컨테이너 높이 및 마진 축소
  tabContainer: { flexDirection: 'row', width: '92%', height: 38, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, marginTop: 10, padding: 3, borderWidth: 1 },
  tabButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  // 탭 라벨 폰트 축소
  tabLabel: { color: '#888', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  activeTabLabel: { color: '#FFF' },

  // 필터 섹션 마진 및 패딩 축소
  filterSection: { width: '92%', marginTop: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  filterButton: { flex: 1, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  filterButtonActive: { backgroundColor: DrawerTheme.goldBrass, borderColor: DrawerTheme.goldBright },
  // 필터 텍스트 폰트 축소
  filterText: { fontSize: 10, color: '#AAA', fontWeight: 'bold' },
  filterTextActive: { color: '#1A0F0A' },
  yearSelector: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  yearButton: { flex: 1, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  yearButtonActive: { backgroundColor: DrawerTheme.woodMid, borderColor: DrawerTheme.goldBrass },
  // 연도 텍스트 폰트 축소
  yearText: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  yearTextActive: { color: DrawerTheme.goldBright },
  monthSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  monthButton: { width: '15%', paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  monthButtonActive: { backgroundColor: DrawerTheme.woodMid, borderColor: DrawerTheme.goldBrass },
  // 월 텍스트 폰트 축소
  monthText: { fontSize: 9, color: '#999', fontWeight: 'bold' },
  monthTextActive: { color: DrawerTheme.goldBright },

  // ✅ 선택 모드 UI (수정됨)
  selectionControl: { width: '92%', marginTop: 8 },
  selectionActions: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: DrawerTheme.goldBrass
  },
  selectedCount: {
    fontSize: 13,
    color: DrawerTheme.goldBrass,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 13,
    color: '#AAA',
    fontWeight: 'bold'
  },
  deleteAllButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,107,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.4)',
    alignItems: 'center'
  },
  deleteAllText: {
    fontSize: 13,
    color: '#ff6b6b',
    fontWeight: 'bold'
  },
  deleteAllTextDisabled: {
    color: '#555'
  },

  // ✅ 힌트 텍스트
  hintContainer: {
    width: '92%',
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)'
  },
  hintText: {
    fontSize: 11,
    color: DrawerTheme.woodLight,
    textAlign: 'center',
    lineHeight: 16
  },

  manualAddDrawer: { height: 100, margin: 2, borderWidth: 1.5, borderStyle: 'dashed', borderColor: DrawerTheme.goldBrass, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  manualAddText: { fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, fontStyle: 'italic' }
});

export default HistoryScreen;