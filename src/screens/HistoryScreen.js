import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
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

  // 데이터 로드 통합 함수
  const fetchData = useCallback(async (isRefresh = false) => {
    if (!customer?.id) return;
    
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [{ data, error: vError }, { count, error: cError }] = await Promise.all([
        visitService.getVisits(customer.id),
        couponService.getCouponCount(customer.id)
      ]);

      if (!vError) setVisits(data || []);
      if (!cError) setCouponCount(count || 0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customer?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleDeleteVisit = (visitId, hasCard) => {
    Alert.alert(
      '삭제 확인',
      hasCard ? '이 방문 기록을 삭제하시겠습니까?\n선택한 카드와 리뷰가 모두 삭제됩니다.' : '이 방문 기록을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const { error } = await visitService.deleteVisit(visitId);
            if (!error) {
              Alert.alert('알림', '기록이 삭제되었습니다.');
              fetchData();
              refreshCustomer();
            }
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
            <Text style={styles.customerName}>{customer?.nickname}님의 방문 기록</Text>
          </View>
        </View>
      </View>
      <View style={styles.statsContainer}>
        <StatsCard label="현재 스탬프" value={`${customer?.current_stamps || 0}/10`} icon="⭐" />
        <StatsCard label="총 방문" value={customer?.visit_count || 0} icon="📅" />
        <StatsCard label="보유 쿠폰" value={couponCount} icon="🎟️" onPress={() => navigation.navigate('Coupon')} />
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

  if (loading) return (
    <GradientBackground><LoadingSpinner message="데이터 로딩 중..." /></GradientBackground>
  );

  if (!customer) return (
    <GradientBackground>
      <View style={styles.errorContainer}><Text style={styles.errorText}>로그인이 필요합니다</Text></View>
    </GradientBackground>
  );

  return (
    <GradientBackground>
      <FlatList
        data={visits}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <VisitCard
            visit={item}
            onSelectCard={(visitId) => navigation.navigate('CardSelection', { visitId })}
            onDelete={handleDeleteVisit}
            onRefresh={fetchData}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => fetchData(true)} 
            tintColor={Colors.gold} 
            colors={[Colors.gold]} 
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={21}
        bounces={true}
        scrollEventThrottle={16}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  listContent: { padding: 20, paddingBottom: 100 },
  header: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.gold,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: Colors.gold, marginBottom: 5 },
  customerName: { fontSize: 16, color: Colors.lavender },
  statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  emptyContainer: {
    alignItems: 'center',
    padding: 60,
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
    marginTop: 20,
  },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: Colors.gold, marginBottom: 10 },
  emptyText: { fontSize: 16, color: Colors.lavender, textAlign: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, color: Colors.redSoft, textAlign: 'center' },
});

export default HistoryScreen;