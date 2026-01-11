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

// 컴포넌트 임포트
import { GradientBackground } from '../components/GradientBackground';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatsCard } from '../components/StatsCard';
import { DrawerChest } from '../components/DrawerChest';
import { DrawerUnit } from '../components/DrawerUnit';
import { TarotCardModal } from '../components/TarotCardModal';

// 서비스 및 테마
import { useAuth } from '../hooks/useAuth';
import { visitService } from '../services/visitService';
import { couponService } from '../services/couponService';
import { DrawerTheme } from '../constants/theme';
import { handleApiCall, showSuccessAlert } from '../utils/errorHandler';

const HistoryScreen = ({ navigation }) => {
  const { customer, refreshCustomer } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [couponCount, setCouponCount] = useState(0);
  
  // 모달 제어 상태
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (customer) {
        loadData();
      } else {
        setLoading(false);
      }
    }, [customer])
  );

  const loadData = async () => {
    try {
      await Promise.all([loadVisits(), loadCouponCount()]);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const loadVisits = async () => {
    const { data, error } = await handleApiCall(
      'HistoryScreen.loadVisits',
      () => visitService.getVisits(customer.id)
    );
    if (!error && data) {
      // 서버 데이터를 최신순으로 정렬하여 서랍장에 배치
      setVisits(data);
    }
  };

  const loadCouponCount = async () => {
    const { data: count, error } = await handleApiCall(
      'HistoryScreen.loadCouponCount',
      () => couponService.getCouponCount(customer.id)
    );
    if (!error) setCouponCount(count || 0);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // 서랍 클릭 시 모달 열기
  const handleOpenModal = (visit) => {
    setSelectedVisit(visit);
    setIsModalVisible(true);
  };

  // 수정 화면 이동
  const handleEditDetail = (visitId) => {
    navigation.navigate('VisitDetail', { visitId });
  };

  // 삭제 로직 (모달에서 최종 확인 후 호출됨)
  const handleDeleteVisit = async (visitId) => {
    const { error } = await handleApiCall(
      'HistoryScreen.deleteVisit',
      () => visitService.deleteVisit(visitId)
    );
    if (!error) {
      showSuccessAlert('DELETE', Alert);
      loadData(); // 리스트 새로고침
      refreshCustomer(); // 상단 통계 새로고침
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.title, { color: DrawerTheme.goldBrass }]}>TAROT ARCHIVE</Text>
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
    </View>
  );

  const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: 40, marginBottom: 20 },
  title: { fontSize: 26, letterSpacing: 5, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Cochin' : 'serif' },
  brassBoard: { flexDirection: 'row', width: '92%', marginTop: 20, padding: 15, borderRadius: 8, borderWidth: 2, elevation: 10 },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, marginBottom: 4, fontWeight: 'bold' },
  statValue: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },
  divider: { width: 1, height: 25 }
  });

  // 하나의 서랍장 프레임(Chest) 안에 모든 서랍(Unit)을 담음
  const renderDrawerChest = () => {
    if (visits.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>아직 비어있는 서랍장입니다.</Text>
        </View>
      );
    }

    return (
      <DrawerChest>
        {visits.map((item) => (
          <DrawerUnit
            key={item.id.toString()}
            visit={item}
            onSelectCard={() => handleOpenModal(item)}
          />
        ))}
      </DrawerChest>
    );
  };

  if (loading) return <GradientBackground><LoadingSpinner /></GradientBackground>;

  return (
    <GradientBackground>
      <FlatList
        data={[1]} // DrawerChest 전체를 하나의 아이템으로 취급
        keyExtractor={(item) => item.toString()}
        renderItem={renderDrawerChest}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            tintColor={DrawerTheme.gold} 
          />
        }
      />

      <TarotCardModal
        isVisible={isModalVisible}
        visit={selectedVisit}
        onClose={() => setIsModalVisible(false)}
        onEdit={handleEditDetail}
        onDelete={handleDeleteVisit}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 10,
    paddingBottom: 80,
  },
  headerArea: {
    marginBottom: 15,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: DrawerTheme.gold,
    marginVertical: 15,
    fontFamily: 'serif',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: DrawerTheme.woodLight,
    fontSize: 16,
    fontStyle: 'italic',
  }
});

export default HistoryScreen;