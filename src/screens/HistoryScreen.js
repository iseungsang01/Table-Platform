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
import { handleApiCall, showSuccessAlert } from '../utils/errorHandler';

const HistoryScreen = ({ navigation }) => {
  const { customer, refreshCustomer } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [couponCount, setCouponCount] = useState(0);

  useEffect(() => {
    console.log('========================================');
    console.log('🏠 [HistoryScreen] 컴포넌트 마운트');
    console.log('🏠 [HistoryScreen] Customer 정보:', customer ? {
      id: customer.id,
      nickname: customer.nickname,
      phone: customer.phone_number
    } : 'null');
    console.log('========================================');
  }, []);

  useEffect(() => {
    console.log('🔄 [HistoryScreen] Customer 변경 감지:', customer?.nickname || 'null');
  }, [customer]);

  useFocusEffect(
    useCallback(() => {
      console.log('========================================');
      console.log('👀 [HistoryScreen] 화면 포커스됨');
      console.log('👤 [HistoryScreen] Customer:', customer?.nickname || 'null');
      console.log('========================================');
      
      if (customer) {
        console.log('✅ [HistoryScreen] 데이터 로드 시작');
        loadData();
      } else {
        console.error('❌ [HistoryScreen] Customer가 없어서 데이터 로드 불가');
        setLoading(false);
      }
    }, [customer])
  );

  const loadData = async () => {
    console.log('========================================');
    console.log('📊 [HistoryScreen] loadData 시작');
    console.log('📊 [HistoryScreen] Customer ID:', customer?.id);
    console.log('========================================');
    
    try {
      await Promise.all([
        loadVisits(),
        loadCouponCount(),
      ]);
      
      console.log('✅ [HistoryScreen] loadData 완료');
      setLoading(false);
    } catch (error) {
      console.error('❌ [HistoryScreen] loadData 오류:', error);
      setLoading(false);
    }
  };

  const loadVisits = async () => {
    if (!customer) {
      console.error('❌ [HistoryScreen] loadVisits: Customer 없음');
      return;
    }
    
    console.log('📥 [HistoryScreen] loadVisits 시작');
    console.log('📥 [HistoryScreen] Customer ID:', customer.id);
    
    const { data, error } = await handleApiCall(
      'HistoryScreen.loadVisits',
      () => visitService.getVisits(customer.id),
      {
        showAlert: true,
        additionalInfo: { customerId: customer.id },
      }
    );
    
    if (!error && data) {
      console.log('✅ [HistoryScreen] loadVisits 성공:', data.length, '건');
      setVisits(data);
    }
  };

  const loadCouponCount = async () => {
    if (!customer) {
      console.error('❌ [HistoryScreen] loadCouponCount: Customer 없음');
      return;
    }
    
    console.log('🎟️ [HistoryScreen] loadCouponCount 시작');
    
    const { data: count, error } = await handleApiCall(
      'HistoryScreen.loadCouponCount',
      () => couponService.getCouponCount(customer.id),
      {
        showAlert: false,
        additionalInfo: { customerId: customer.id },
      }
    );
    
    if (!error) {
      console.log('✅ [HistoryScreen] loadCouponCount 성공:', count);
      setCouponCount(count || 0);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 [HistoryScreen] 새로고침 시작');
    setRefreshing(true);
    await Promise.all([
      loadVisits(),
      loadCouponCount(),
    ]);
    setRefreshing(false);
    console.log('✅ [HistoryScreen] 새로고침 완료');
  };

  const handleSelectCard = (visitId) => {
    console.log('🎴 [HistoryScreen] 방문 상세 화면 이동:', visitId);
    navigation.navigate('VisitDetail', { visitId }); // ✅ 변경된 라우트 이름
  };

  const handleDeleteVisit = (visitId, hasCard) => {
    console.log('🗑️ [HistoryScreen] 방문 기록 삭제 요청:', visitId);
    
    const message = hasCard
      ? '이 방문 기록을 삭제하시겠습니까?\n선택한 카드와 리뷰가 모두 삭제됩니다.'
      : '이 방문 기록을 삭제하시겠습니까?';

    Alert.alert(
      '삭제 확인',
      message,
      [
        { 
          text: '취소', 
          style: 'cancel',
          onPress: () => console.log('🚫 [HistoryScreen] 삭제 취소됨')
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            console.log('🗑️ [HistoryScreen] 삭제 진행 중...');
            
            const { error } = await handleApiCall(
              'HistoryScreen.handleDeleteVisit',
              () => visitService.deleteVisit(visitId),
              {
                showAlert: true,
                additionalInfo: { visitId },
              }
            );

            if (!error) {
              console.log('✅ [HistoryScreen] 삭제 성공');
              showSuccessAlert('DELETE', Alert);
              await loadVisits();
              await refreshCustomer();
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
          onPress={() => {
            console.log('🎟️ [HistoryScreen] 쿠폰 화면 이동');
            navigation.navigate('Coupon');
          }}
        />
      </View>
    </View>
  );

  const renderEmpty = () => {
    console.log('📭 [HistoryScreen] 빈 상태 렌더링');
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🃏</Text>
        <Text style={styles.emptyTitle}>아직 방문 기록이 없습니다</Text>
        <Text style={styles.emptyText}>매장을 방문하고 첫 타로 카드를 선택해보세요!</Text>
      </View>
    );
  };

  console.log('🎨 [HistoryScreen] 렌더링:', {
    loading,
    customer: customer?.nickname || 'null',
    visitsCount: visits.length
  });

  if (loading) {
    console.log('⏳ [HistoryScreen] 로딩 중...');
    return (
      <GradientBackground>
        <LoadingSpinner message="데이터 로딩 중..." />
      </GradientBackground>
    );
  }

  if (!customer) {
    console.error('❌ [HistoryScreen] Customer 없음 - 로그인 필요');
    return (
      <GradientBackground>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>로그인이 필요합니다</Text>
        </View>
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
        showsVerticalScrollIndicator={true}
        removeClippedSubviews={false}
        windowSize={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16, // 20 -> 16 (전체적인 여백 축소)
    paddingBottom: 100, // 140 -> 100 (하단 여백 조정)
  },
  header: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 12, // 20 -> 12 (둥근 모서리 반경 축소)
    padding: 15, // 25 -> 15 (내부 여백 축소)
    marginBottom: 16, // 20 -> 16
    borderWidth: 1.5, // 3 -> 1.5 (테두리 두께를 얇게 하여 세련되게 변경)
    borderColor: Colors.gold,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20, // 28 -> 20 (제목 크기 대폭 축소)
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 2, // 5 -> 2
  },
  customerName: {
    fontSize: 13, // 16 -> 13
    color: Colors.lavender,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10, // 15 -> 10 (카드 사이 간격 축소)
    marginBottom: 20, // 30 -> 20
  },
  // 빈 상태(데이터 없을 때) 레이아웃 축소
  emptyContainer: {
    alignItems: 'center',
    padding: 30, // 60 -> 30
    backgroundColor: Colors.purpleMid,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.purpleLight,
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 50, // 80 -> 50 (아이콘 크기 축소)
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18, // 24 -> 18
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13, // 16 -> 13
    color: Colors.lavender,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 15, // 18 -> 15
    color: Colors.redSoft,
    textAlign: 'center',
  },
});

export default HistoryScreen;