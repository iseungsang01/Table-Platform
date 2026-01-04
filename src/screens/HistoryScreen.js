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
   * 🔍 디버깅: 컴포넌트 마운트 시
   */
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

  /**
   * 🔍 디버깅: customer 변경 감지
   */
  useEffect(() => {
    console.log('🔄 [HistoryScreen] Customer 변경 감지:', customer?.nickname || 'null');
  }, [customer]);

  /**
   * 화면 포커스 시 데이터 로드
   */
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

  /**
   * 데이터 로드 (통합)
   */
  const loadData = async () => {
    console.log('========================================');
    console.log('📊 [HistoryScreen] loadData 시작');
    console.log('📊 [HistoryScreen] Customer ID:', customer?.id);
    console.log('========================================');
    
    try {
      // 🔍 디버깅 함수 실행
      console.log('🔍 [HistoryScreen] 디버깅 함수 호출 중...');
      const debugResult = await visitService.debugVisits(customer.id);
      console.log('🔍 [HistoryScreen] 디버깅 결과:', {
        전체방문수: debugResult?.allVisits?.length || 0,
        내방문수: debugResult?.myVisits?.length || 0
      });
      
      // 실제 데이터 로드
      console.log('📥 [HistoryScreen] 실제 데이터 로드 시작...');
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

  /**
   * 방문 기록 조회
   */
  const loadVisits = async () => {
    if (!customer) {
      console.error('❌ [HistoryScreen] loadVisits: Customer 없음');
      return;
    }
    
    console.log('📥 [HistoryScreen] loadVisits 시작');
    console.log('📥 [HistoryScreen] Customer ID:', customer.id);
    
    const { data, error } = await visitService.getVisits(customer.id);
    
    if (error) {
      console.error('❌ [HistoryScreen] loadVisits 오류:', error);
    } else {
      console.log('✅ [HistoryScreen] loadVisits 성공:', data?.length || 0, '건');
      setVisits(data || []);
    }
  };

  /**
   * 쿠폰 개수 조회
   */
  const loadCouponCount = async () => {
    if (!customer) {
      console.error('❌ [HistoryScreen] loadCouponCount: Customer 없음');
      return;
    }
    
    console.log('🎟️ [HistoryScreen] loadCouponCount 시작');
    
    const { count, error } = await couponService.getCouponCount(customer.id);
    
    if (error) {
      console.error('❌ [HistoryScreen] loadCouponCount 오류:', error);
    } else {
      console.log('✅ [HistoryScreen] loadCouponCount 성공:', count);
      setCouponCount(count || 0);
    }
  };

  /**
   * 새로고침
   */
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

  /**
   * 카드 선택 화면 이동
   */
  const handleSelectCard = (visitId) => {
    console.log('🎴 [HistoryScreen] 카드 선택 화면 이동:', visitId);
    navigation.navigate('CardSelection', { visitId });
  };

  /**
   * 방문 기록 삭제
   */
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
            
            const { error } = await visitService.deleteVisit(visitId);
            
            if (!error) {
              console.log('✅ [HistoryScreen] 삭제 성공');
              Alert.alert('알림', '🗑️ 기록이 삭제되었습니다.');
              await loadVisits();
              await refreshCustomer();
            } else {
              console.error('❌ [HistoryScreen] 삭제 실패:', error);
            }
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

  /**
   * 빈 상태 렌더링
   */
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

  /**
   * 🔍 디버깅: 렌더링 시
   */
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
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 20,
    paddingBottom: 140,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.redSoft,
    textAlign: 'center',
  },
});

export default HistoryScreen;