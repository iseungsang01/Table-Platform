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
  const [actualCouponCount, setActualCouponCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [customer])
  );

  const loadData = async () => {
    await Promise.all([
      loadVisits(),
      loadCouponCount(),
      refreshCustomer(),
    ]);
    setLoading(false);
  };

  const loadVisits = async () => {
    const { data, error } = await visitService.getVisits(customer.id);
    if (!error && data) {
      setVisits(data);
    }
  };

  const loadCouponCount = async () => {
    const { count } = await couponService.getCouponCount(customer.id);
    setActualCouponCount(count || 0);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSelectCard = (visitId) => {
    navigation.navigate('CardSelection', { visitId });
  };

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
              loadVisits();
              refreshCustomer();
            }
          },
        },
      ]
    );
  };

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
          value={actualCouponCount}
          icon="🎟️"
          onPress={() => navigation.navigate('Coupon')}
        />
      </View>
    </View>
  );

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
      <TouchableOpacity 
        style={styles.fixedLogoutButton} 
        onPress={handleLogout}
        activeOpacity={0.7}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </TouchableOpacity>

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
  fixedLogoutButton: {
    position: 'absolute',
    top: 50, // 상태바 아래 적절한 위치
    right: 20,
    backgroundColor: 'rgba(255, 69, 0, 0.6)', // 배경색을 좀 더 진하게
    borderWidth: 1,
    borderColor: Colors.red,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    zIndex: 999, 
    elevation: 10,
  },
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
    elevation: 10,         // 안드로이드에서 다른 요소보다 위로
    zIndex: 999,           // iOS에서 다른 요소보다 위로
    position: 'relative',
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