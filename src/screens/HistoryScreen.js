import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground } from '../components/GradientBackground';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatsCard } from '../components/StatsCard';
import { DrawerChest } from '../components/DrawerChest'; // 전체 틀
import { DrawerUnit } from '../components/DrawerUnit';   // 개별 서랍
import { TarotCardModal } from '../components/TarotCardModal';

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
  
  const [openDrawerId, setOpenDrawerId] = useState(null);
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
      // 최신 방문이 위로 오도록 정렬 (서랍장 위에서부터 새 서랍)
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

  const handleToggleDrawer = (visitId) => {
    setOpenDrawerId(openDrawerId === visitId ? null : visitId);
  };

  const handleOpenModal = (visit) => {
    setSelectedVisit(visit);
    setIsModalVisible(true);
  };

  const handleEditDetail = (visitId) => {
    navigation.navigate('VisitDetail', { visitId });
  };

  const handleDeleteVisit = (visitId, hasCard) => {
    Alert.alert('삭제 확인', '이 서랍의 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const { error } = await handleApiCall(
            'HistoryScreen.deleteVisit',
            () => visitService.deleteVisit(visitId)
          );
          if (!error) {
            showSuccessAlert('DELETE', Alert);
            loadData();
            refreshCustomer();
          }
        },
      },
    ]);
  };

  // 1. 헤더 영역 (통계 카드들)
  const renderHeader = () => (
    <View style={styles.headerArea}>
      <Text style={styles.mainTitle}>🗂️ 나의 타로 서랍장</Text>
      <View style={styles.statsRow}>
        <StatsCard label="스탬프" value={`${customer?.current_stamps}/10`} icon="⭐" />
        <StatsCard label="총 방문" value={customer?.visit_count} icon="📅" />
        <StatsCard label="쿠폰" value={couponCount} icon="🎟️" onPress={() => navigation.navigate('Coupon')} />
      </View>
      {/* 서랍장 시작 부분을 알려주는 여백 */}
      <View style={{ height: 20 }} />
    </View>
  );

  // 2. 서랍 리스트를 DrawerChest 하나로 감싸서 렌더링
  const renderContent = () => {
    if (visits.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>아직 서랍장이 비어있습니다.</Text>
        </View>
      );
    }

    return (
      <DrawerChest>
        {visits.map((item, index) => (
          <DrawerUnit
            key={item.id.toString()}
            visit={item}
            isOpen={openDrawerId === item.id}
            onToggle={() => handleToggleDrawer(item.id)}
            onSelectCard={() => handleOpenModal(item)}
            onDelete={handleDeleteVisit}
          />
        ))}
      </DrawerChest>
    );
  };

  if (loading) return <GradientBackground><LoadingSpinner /></GradientBackground>;

  return (
    <GradientBackground>
      {/* 서랍장이 길어지므로 ScrollView 역할을 하는 FlatList 사용 */}
      <FlatList
        data={[1]} // 단일 서랍장 객체를 그리기 위한 가짜 데이터
        keyExtractor={(item) => item.toString()}
        renderItem={() => renderContent()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={DrawerTheme.gold} />
        }
      />

      <TarotCardModal 
        isVisible={isModalVisible}
        visit={selectedVisit}
        onClose={() => setIsModalVisible(false)}
        onEdit={handleEditDetail} // 수정 페이지 이동
        onDelete={handleDeleteVisit} // 삭제 실행 함수
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  headerArea: {
    marginBottom: 10,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: DrawerTheme.gold,
    marginVertical: 15,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 5,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: DrawerTheme.woodLight,
    fontSize: 16,
  }
});

export default HistoryScreen;