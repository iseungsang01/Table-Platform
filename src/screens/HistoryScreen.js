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

const LOCAL_STORAGE_KEY = 'offline_visit_history';

const HistoryScreen = ({ navigation }) => {
  const { customer, refreshCustomer } = useAuth();
  const [visits, setVisits] = useState([]); // 서버 데이터 (ON)
  const [personalNotes, setPersonalNotes] = useState([]); // 로컬 데이터 (OFF)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [couponCount, setCouponCount] = useState(0);
  const [archiveMode, setArchiveMode] = useState('ALL'); // ALL, ON, OFF
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 화면 포커스 시마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      if (customer) loadData();
      else setLoading(false);
    }, [customer])
  );

  const loadData = async () => {
    try {
      // 1. 서버(ON) 데이터 가져오기
      const { data: visitData } = await handleApiCall(
        'HistoryScreen.loadVisits',
        () => visitService.getVisits(customer.id)
      );
      if (visitData) setVisits(visitData.map(v => ({ ...v, isDbRecord: true })));

      // 2. 로컬(OFF) 데이터 가져오기 (핵심 추가)
      const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      const localData = stored ? JSON.parse(stored) : [];
      setPersonalNotes(localData.map(v => ({ ...v, isDbRecord: false })));

      await loadCouponCount();
    } catch (error) {
      console.error("Data Load Error:", error);
    } finally {
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

  // 삭제 로직 (서버/로컬 분기)
  const handleDeleteVisit = async (visitId) => {
    if (selectedItem?.isDbRecord) {
      // 서버 삭제
      const { error } = await handleApiCall('HistoryScreen.deleteVisit', () => visitService.deleteVisit(visitId));
      if (!error) {
        showSuccessAlert('DELETE', Alert);
        refreshCustomer();
      }
    } else {
      // 로컬 삭제
      const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      const filtered = list.filter(v => v.id !== visitId);
      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      showSuccessAlert('DELETE', Alert);
    }
    setIsModalVisible(false);
    loadData();
  };

  const getDisplayData = () => {
    if (archiveMode === 'ON') return visits;
    if (archiveMode === 'OFF') return personalNotes;
    // ALL 모드: 두 데이터를 합쳐서 최신 날짜순 정렬
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
        <View style={styles.statBox}><Text style={[styles.statLabel, { color: DrawerTheme.woodLight }]}>스탬프</Text><Text style={styles.statValue}>{customer?.current_stamps}/10</Text></View>
        <View style={[styles.divider, { backgroundColor: DrawerTheme.woodFrame }]} />
        <View style={styles.statBox}><Text style={[styles.statLabel, { color: DrawerTheme.woodLight }]}>방문 횟수</Text><Text style={styles.statValue}>{customer?.visit_count}</Text></View>
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
              onSelectCard={() => {
                setSelectedItem(item);
                setIsModalVisible(true);
              }}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: DrawerTheme.woodLight }]}>아직 비어있는 서랍장입니다.</Text>
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
            mode: selectedItem?.isDbRecord ? 'server' : 'manual' 
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
  manualAddDrawer: { height: 100, margin: 2, borderWidth: 1.5, borderStyle: 'dashed', borderColor: DrawerTheme.goldBrass, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  manualAddText: { fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, fontStyle: 'italic' }
});

export default HistoryScreen;