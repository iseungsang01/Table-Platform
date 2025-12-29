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
  const { customer, logout, refreshCustomer } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [couponCount, setCouponCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [customer])
  );

  /**
   * 데이터 로드
   */
  const loadData = async () => {
    await Promise.all([
      loadVisits(),
      loadCouponCount(),
    ]);
    
    // 고객 정보는 스탬프/쿠폰 변경 시에만 새로고침
    await refreshCustomer();
    
    setLoading(false);
  };

  /**
   * 방문 기록 조회
   */
  const loadVisits = async () => {
    const { data, error } = await visitService.getVisits(customer.id);
    if (!error && data) {
      setVisits(data);
    }
  };

  /**
   * 쿠폰 개수 조회 (실시간 카운트)
   */
  const loadCouponCount = async () => {
    const { count } = await couponService.getCouponCount(customer.id);
    setCouponCount(count || 0);
  };

  /**
   * 새로고침
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
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
              await refreshCustomer();
            }
          },
        },
      ]
    );
  };

  /**
   * 로그아웃
   */
  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  /**
   * 헤더 렌더링
   */
  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>🔮 나의 타로 기록</Text>
            <Text style={styles.customerName}>{customer.nickname}님의 방문 기록</Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </TouchableOpacity>
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
  logoutButton: {
    backgroundColor: 'rgba(255, 69, 0, 0.3)',
    borderWidth: 2,
    borderColor: Colors.red,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  logoutButtonText: {
    color: '#ffb3b3',
    fontSize: 14,
    fontWeight: '600',
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