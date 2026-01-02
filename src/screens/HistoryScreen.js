import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground } from '../components/GradientBackground';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { VisitCard } from '../components/VisitCard';
import { StatsCard } from '../components/StatsCard';
import { useAuth } from '../hooks/useAuth';
import { visitService } from '../services/visitService';
import { couponService } from '../services/couponService';
import { Colors } from '../constants/Colors';

const HistoryScreen = ({ navigation }) => {
  const { customer, refreshCustomer } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [couponCount, setCouponCount] = useState(0);

  /**
   * 화면 포커스 시 데이터 로드 (최적화)
   * refreshCustomer 제거 - 필요할 때만 명시적으로 호출
   */
  useFocusEffect(
    useCallback(() => {
      console.log('📱 HistoryScreen 포커스');
      loadData();
    }, [])
  );

  /**
   * 데이터 로드
   */
  const loadData = async () => {
    await Promise.all([
      loadVisits(),
      loadCouponCount(),
    ]);
    
    setLoading(false);
  };

  /**
   * 방문 기록 조회
   */
  const loadVisits = async () => {
    if (!customer) return;
    
    const { data, error } = await visitService.getVisits(customer.id);
    if (!error && data) {
      setVisits(data);
    }
  };

  /**
   * 쿠폰 개수 조회 (실시간 카운트)
   */
  const loadCouponCount = async () => {
    if (!customer) return;
    
    const { count } = await couponService.getCouponCount(customer.id);
    setCouponCount(count || 0);
  };

  /**
   * 새로고침
   * 필요한 경우에만 refreshCustomer 호출
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadVisits(),
      loadCouponCount(),
    ]);
    setRefreshing(false);
  };

  /**
   * 카드 선택 화면 이동
   */
  const handleSelectCard = (visitId) => {
    navigation.navigate('CardSelection', { visitId });
  };

  /**
   * 방문 기록 삭제
   */
  const handleDeleteVisit = (visitId, hasCard) => {
    const message = hasCard
      ? '이 방문 기록을 삭제하시겠습니까?\n선택한 카드와 리뷰가 모두 삭제됩니다.'
      : '이 방문 기록을 삭제하시겠습니까?';

    Alert.alert(
      '삭제 확인',
      message,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const { error } = await visitService.deleteVisit(visitId);
            if (!error) {
              Alert.alert('알림', '🗑️ 기록이 삭제되었습니다.');
              await loadVisits();
              // 스탬프가 변경되었으므로 고객 정보 갱신
              await refreshCustomer();
            }
          },
        },
      ]
    );
  };

  /**
   * 헤더 렌더링 (로그아웃 버튼 제거)
   */
  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>🔮 나의 타로 기록</Text>
            <Text style={styles.customerName}>{customer.nickname}님의 방문 기록</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <StatsCard
          label="현재 스탬프"
          value={`${customer.current_stamps}/10`}
          icon="⭐"
        />
        <StatsCard
          label="총 방문"
          value={customer.visit_count}
          icon="📅"
        />
        <StatsCard
          label="보유 쿠폰"
          value={couponCount}
          icon="🎟️"
          onPress={() => navigation.navigate('Coupon')}
        />
      </View>
    </View>
  );

  /**
   * 빈 상태 렌더링
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🃏</Text>
      <Text style={styles.emptyTitle}>아직 방문 기록이 없습니다</Text>
      <Text style={styles.emptyText}>매장을 방문하고 첫 타로 카드를 선택해보세요!</Text>
    </View>
  );

  if (loading) {
    return (
      <GradientBackground>
        <LoadingSpinner />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <FlatList
        data={visits}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <VisitCard
            visit={item}
            onSelectCard={handleSelectCard}
            onDelete={handleDeleteVisit}
            onRefresh={loadVisits}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.gold,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 5,
  },
  customerName: {
    fontSize: 16,
    color: Colors.lavender,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 60,
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
    marginTop: 20,
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
});

export default HistoryScreen;