import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Platform,
  TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// 컴포넌트 및 테마 임포트
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

const HistoryScreen = ({ navigation }) => {
  const { customer, refreshCustomer } = useAuth();
  const [visits, setVisits] = useState([]);
  const [personalNotes, setPersonalNotes] = useState([]); // 개인 메모용 상태
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [couponCount, setCouponCount] = useState(0);
  const [archiveMode, setArchiveMode] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (customer) { loadData(); } else { setLoading(false); }
    }, [customer])
  );

  const loadData = async () => {
    try {
      const { data: visitData } = await handleApiCall(
        'HistoryScreen.loadVisits',
        () => visitService.getVisits(customer.id)
      );
      
      // DB 기반 방문 기록은 isDbRecord: true를 붙여서 구분
      if (visitData) {
        setVisits(visitData.map(v => ({ ...v, isDbRecord: true })));
      }
      
      // 개인 메모(personalNotes) 로드 로직이 있다면 여기에 추가
      // setPersonalNotes(localData); 

      await loadCouponCount();
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const loadCouponCount = async () => {
    const { data: count } = await handleApiCall(
      'HistoryScreen.loadCouponCount',
      () => couponService.getCouponCount(customer.id)
    );
    if (count !== undefined) setCouponCount(count);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ✅ 오류 해결: 삭제 함수 정의
  const handleDeleteVisit = async (visitId) => {
    const { error } = await handleApiCall(
      'HistoryScreen.deleteVisit',
      () => visitService.deleteVisit(visitId)
    );

    if (!error) {
      showSuccessAlert('DELETE', Alert);
      setIsModalVisible(false); // 모달 닫기
      loadData(); // 데이터 새로고침
      refreshCustomer(); // 상단 스탬프 정보 갱신
    }
  };

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setIsModalVisible(true);
  };

  const getDisplayData = () => {
    if (archiveMode === 'ON') return visits;
    if (archiveMode === 'OFF') return personalNotes;
    return [...visits, ...personalNotes].sort((a, b) => 
      new Date(b.visit_date) - new Date(a.visit_date)
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.title, { color: DrawerTheme.goldBrass }]}>
        {archiveMode === 'OFF' ? 'PRIVATE NOTES' : 'TAROT ARCHIVE'}
      </Text>

      <View style={[styles.brassBoard, { backgroundColor: DrawerTheme.woodDark, borderColor: DrawerTheme.woodFrame }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: DrawerTheme.woodLight }]}>STAMPS</Text>
          <Text style={styles.statValue}>{customer?.current_stamps}/10</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: DrawerTheme.woodFrame }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: DrawerTheme.woodLight }]}>VISITS</Text>
          <Text style={styles.statValue}>{customer?.visit_count}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: DrawerTheme.woodFrame }]} />
        <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('Coupon')}>
          <Text style={[styles.statLabel, { color: DrawerTheme.woodLight }]}>COUPONS</Text>
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
            style={[
              styles.tabButton,
              archiveMode === tab.id && { backgroundColor: tab.color, borderColor: DrawerTheme.goldBright }
            ]}
          >
            <Text style={[styles.tabLabel, archiveMode === tab.id && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDrawerChest = () => {
    const displayData = getDisplayData();
    return (
      <DrawerChest>
        {archiveMode === 'OFF' && (
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.manualAddDrawer, { backgroundColor: DrawerTheme.navyDark }]}
            onPress={() => navigation.navigate('VisitDetail', { mode: 'manual' })}
          >
            <Text style={[styles.manualAddText, { color: DrawerTheme.goldBrass }]}>+ 개인 메모 서랍 추가</Text>
          </TouchableOpacity>
        )}
        {displayData.length > 0 ? (
          displayData.map((item) => (
            <DrawerUnit
              key={item.id.toString()}
              visit={item}
              onSelectCard={() => handleOpenModal(item)}
            />
          ))
        ) : (
          archiveMode !== 'OFF' && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: DrawerTheme.woodLight }]}>아직 비어있는 서랍장입니다.</Text>
            </View>
          )
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={DrawerTheme.goldBrass} />
        }
      />
      <TarotCardModal
        isVisible={isModalVisible}
        visit={selectedItem}
        onClose={() => setIsModalVisible(false)}
        onEdit={(id) => navigation.navigate('VisitDetail', { visitId: id })}
        onDelete={handleDeleteVisit} // ✅ 이제 이 함수가 존재합니다!
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
  tabContainer: {
    flexDirection: 'row',
    width: '92%',
    height: 46,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    marginTop: 20,
    padding: 4,
    borderWidth: 1,
  },
  tabButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  tabLabel: { color: '#888', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  activeTabLabel: { color: '#FFF' },
  manualAddDrawer: {
    height: 100, margin: 2, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: DrawerTheme.goldBrass, justifyContent: 'center', alignItems: 'center', marginBottom: 5,
  },
  manualAddText: { fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, fontStyle: 'italic' }
});

export default HistoryScreen;