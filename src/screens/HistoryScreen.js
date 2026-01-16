import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, Platform, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import { storage } from '../utils/storage';

const LOCAL_STORAGE_KEY = 'offline_visit_history';

const HistoryScreen = ({ navigation }) => {
  const { customer, refreshCustomer } = useAuth();
  const [visits, setVisits] = useState([]);
  const [personalNotes, setPersonalNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [couponCount, setCouponCount] = useState(0);
  const [archiveMode, setArchiveMode] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [stats, setStats] = useState({
    current_stamps: customer?.current_stamps || 0,
    visit_count: customer?.visit_count || 0
  });

  const [timeFilter, setTimeFilter] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useFocusEffect(
    useCallback(() => {
      if (customer) loadData();
      else setLoading(false);
    }, [customer])
  );

  const loadData = async () => {
    try {
      console.log('🔄 [HistoryScreen] loadData 시작');

      // 1. 스탬프 & 방문횟수 최신화
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

      // 2. ✅ 방문 기록 로드 (Orphaned 데이터 자동 정리 포함)
      const { data: visitData } = await handleApiCall(
        'HistoryScreen.loadVisits',
        () => visitService.getVisits(customer.id)
      );
      
      const formattedVisits = visitData ? visitData.map(v => ({ 
        ...v, 
        is_manual: false 
      })) : [];
      
      console.log('✅ [HistoryScreen] 서버 기록 로드:', formattedVisits.length, '개');
      setVisits(formattedVisits);

      // 3. 개인 메모 로드
      const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      const localData = stored ? JSON.parse(stored) : [];
      
      const formattedNotes = localData.map(v => ({ 
        ...v, 
        is_manual: true 
      }));
      
      console.log('✅ [HistoryScreen] 개인 메모 로드:', formattedNotes.length, '개');
      setPersonalNotes(formattedNotes);

      // 4. 쿠폰 개수 최신화
      await loadCouponCount();

      console.log('✅ [HistoryScreen] loadData 완료');
    } catch (error) {
      console.error("❌ [HistoryScreen] Data Load Error:", error);
    } finally {
      setLoading(false);
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
    await loadData();
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
        // 로컬 데이터 삭제 (개인 메모)
        console.log('📝 [HistoryScreen] 개인 메모 삭제');
        const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
        const list = stored ? JSON.parse(stored) : [];
        const filtered = list.filter(v => v.id !== visitId);
        await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
        showSuccessAlert('DELETE', Alert);
      } else {
        // 서버 데이터 삭제 (is_deleted 업데이트 + 로컬 스토리지 정리)
        console.log('🗄️ [HistoryScreen] 서버 기록 삭제');
        const { error } = await handleApiCall(
          'HistoryScreen.deleteVisit', 
          () => visitService.deleteVisit(visitId)
        );
        
        if (!error) {
          showSuccessAlert('DELETE', Alert);
          await refreshCustomer(); // 스탬프 개수 업데이트
          
          // ✅ 추가: 로컬 상태에서도 즉시 제거
          setVisits(prevVisits => prevVisits.filter(v => v.id !== visitId));
        } else {
          console.error('❌ [HistoryScreen] 서버 삭제 실패:', error);
          return;
        }
      }

      setIsModalVisible(false);
      
      // ✅ 전체 데이터 다시 로드 (Orphaned 데이터 정리 포함)
      console.log('🔄 [HistoryScreen] 데이터 재로드 중...');
      await loadData();

    } catch (error) {
      console.error('❌ [HistoryScreen] handleDeleteVisit 오류:', error);
      Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
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
              for (const id of serverIds) {
                console.log('  🗄️ 서버 기록 삭제:', id);
                await visitService.deleteVisit(id);
              }

              // 로컬 삭제
              if (localIds.length > 0) {
                console.log('  📝 개인 메모 삭제:', localIds.length, '개');
                const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
                const list = stored ? JSON.parse(stored) : [];
                const filtered = list.filter(v => !localIds.includes(v.id));
                await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
              }

              showSuccessAlert('DELETE', Alert);
              setSelectedIds(new Set());
              setSelectionMode(false);
              
              if (serverIds.length > 0) await refreshCustomer();
              
              // ✅ 전체 데이터 다시 로드
              console.log('🔄 [HistoryScreen] 데이터 재로드 중...');
              await loadData();

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
    if (archiveMode === 'ON') data = visits;
    else if (archiveMode === 'OFF') data = personalNotes;
    else data = [...visits, ...personalNotes].sort((a, b) => 
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

      <View style={styles.selectionControl}>
        <TouchableOpacity
          style={[styles.selectionButton, selectionMode && styles.selectionButtonActive]}
          onPress={() => {
            setSelectionMode(!selectionMode);
            setSelectedIds(new Set());
          }}
        >
          <Text style={[styles.selectionButtonText, selectionMode && styles.selectionButtonTextActive]}>
            {selectionMode ? '선택 취소' : '📦 다중 선택'}
          </Text>
        </TouchableOpacity>

        {selectionMode && (
          <View style={styles.selectionActions}>
            <Text style={styles.selectedCount}>{selectedIds.size}개 선택됨</Text>
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
        )}
      </View>
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

  if (loading) return <GradientBackground><LoadingSpinner /></GradientBackground>;

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
  header: { alignItems: 'center', paddingTop: 40, marginBottom: 20 },
  title: { fontSize: 26, letterSpacing: 5, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Cochin' : 'serif' },
  brassBoard: { flexDirection: 'row', width: '92%', marginTop: 20, padding: 15, borderRadius: 8, borderWidth: 2, elevation: 10 },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, marginBottom: 4, fontWeight: 'bold' },
  statValue: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },
  divider: { width: 1, height: 25 },
  tabContainer: { flexDirection: 'row', width: '92%', height: 46, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, marginTop: 20, padding: 4, borderWidth: 1 },
  tabButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  tabLabel: { color: '#888', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  activeTabLabel: { color: '#FFF' },
  
  filterSection: { width: '92%', marginTop: 15, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  filterButton: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  filterButtonActive: { backgroundColor: DrawerTheme.goldBrass, borderColor: DrawerTheme.goldBright },
  filterText: { fontSize: 12, color: '#AAA', fontWeight: 'bold' },
  filterTextActive: { color: '#1A0F0A' },
  yearSelector: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  yearButton: { flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  yearButtonActive: { backgroundColor: DrawerTheme.woodMid, borderColor: DrawerTheme.goldBrass },
  yearText: { fontSize: 11, color: '#999', fontWeight: 'bold' },
  yearTextActive: { color: DrawerTheme.goldBright },
  monthSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  monthButton: { width: '15%', paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  monthButtonActive: { backgroundColor: DrawerTheme.woodMid, borderColor: DrawerTheme.goldBrass },
  monthText: { fontSize: 10, color: '#999', fontWeight: 'bold' },
  monthTextActive: { color: DrawerTheme.goldBright },

  selectionControl: { width: '92%', marginTop: 12 },
  selectionButton: { paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.3)', alignItems: 'center' },
  selectionButtonActive: { backgroundColor: DrawerTheme.selectionMode, borderColor: DrawerTheme.goldBright },
  selectionButtonText: { fontSize: 14, color: DrawerTheme.goldBrass, fontWeight: 'bold' },
  selectionButtonTextActive: { color: '#FFF' },
  selectionActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingHorizontal: 10 },
  selectedCount: { fontSize: 13, color: DrawerTheme.goldBrass, fontWeight: 'bold' },
  deleteAllButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: 'rgba(255,107,107,0.2)', borderWidth: 1, borderColor: 'rgba(255,107,107,0.4)' },
  deleteAllText: { fontSize: 13, color: '#ff6b6b', fontWeight: 'bold' },
  deleteAllTextDisabled: { color: '#555' },

  manualAddDrawer: { height: 100, margin: 2, borderWidth: 1.5, borderStyle: 'dashed', borderColor: DrawerTheme.goldBrass, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  manualAddText: { fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, fontStyle: 'italic' }
});

export default HistoryScreen;