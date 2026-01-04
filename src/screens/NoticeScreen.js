import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground } from '../components/GradientBackground';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { NoticeCard } from '../components/NoticeCard';
import { useAuth } from '../hooks/useAuth';
import { noticeService } from '../services/noticeService';
import { Colors } from '../constants/Colors';

const NoticeScreen = () => {
  const { customer } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. 공지사항 로드 및 읽음 처리 로직만 유지
  const loadData = async () => {
    // 내역 조회(rRes) 부분 제거
    const nRes = await noticeService.getNotices();
    
    if (!nRes.error) {
      setNotices(nRes.data);
    }
    
    if (customer) {
      await noticeService.markAllNoticesAsRead();
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [customer])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // 2. 헤더 섹션 (공지사항 타이틀)
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>📢 공지사항</Text>
      <Text style={styles.subtitle}>매장의 새로운 소식을 확인하세요</Text>
    </View>
  );

  if (loading) return <GradientBackground><LoadingSpinner /></GradientBackground>;

  return (
    <GradientBackground>
      <FlatList
        data={notices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <NoticeCard notice={item} />}
        ListHeaderComponent={renderHeader}
        // 3. 접수 폼 및 내역 버튼이 있던 ListFooterComponent 제거
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔭</Text>
            <Text style={styles.emptyTitle}>공지사항이 없습니다.</Text>
          </View>
        }
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
    paddingBottom: 40 // 하단 여백 최적화
  },
  header: { 
    backgroundColor: Colors.purpleMid, 
    borderRadius: 20, 
    padding: 25, 
    marginBottom: 20, 
    borderWidth: 3, 
    borderColor: Colors.gold, 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: Colors.gold, 
    marginBottom: 5 
  },
  subtitle: { 
    fontSize: 14, 
    color: Colors.lavender, 
    textAlign: 'center' 
  },
  emptyContainer: { 
    alignItems: 'center', 
    padding: 40 
  },
  emptyIcon: { 
    fontSize: 50, 
    marginBottom: 10 
  },
  emptyTitle: { 
    fontSize: 18, 
    color: Colors.lavender 
  },
});

export default NoticeScreen;