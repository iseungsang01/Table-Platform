import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground, LoadingSpinner, NoticeCard } from '../components'; 
import { useAuth } from '../hooks/useAuth';
import { noticeService } from '../services/noticeService';
import { DrawerTheme } from '../constants/DrawerTheme';

const NoticeScreen = () => {
  const { customer } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const { data, error } = await noticeService.getNotices();
    if (!error) setNotices(data);
    if (customer) await noticeService.markAllNoticesAsRead();
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

  // ✂️ 부피를 줄인 슬림 헤더
  const renderHeader = () => (
    <View style={styles.slimHeader}>
      <View style={styles.titleRow}>
        <Text style={styles.slimIcon}>📢</Text>
        <Text style={styles.slimTitle}>공지사항</Text>
      </View>
      <Text style={styles.slimSubtitle}>매장의 새로운 소식을 확인하세요</Text>
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
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔭</Text>
            <Text style={styles.emptyText}>아직 등록된 소식이 없습니다.</Text>
          </View>
        }
        contentContainerStyle={styles.listArea}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            tintColor={DrawerTheme.goldBrass} 
          />
        }
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  listArea: { 
    padding: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 100 
  },
  
  // 🪵 슬림 헤더 디자인: 높이를 대폭 줄이고 가로형으로 배치
  slimHeader: { 
    backgroundColor: '#3D2B1F', 
    borderRadius: 15, 
    paddingVertical: 18, 
    paddingHorizontal: 20,
    marginBottom: 20, 
    // 그림자 유지하여 깊이감 제공
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 6 
  },
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  slimIcon: { fontSize: 20, marginRight: 8 },
  slimTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: DrawerTheme.goldBrass, 
    letterSpacing: 1 
  },
  slimSubtitle: { 
    fontSize: 12, 
    color: '#A68966', 
    opacity: 0.8
  },

  emptyBox: { 
    alignItems: 'center', 
    paddingTop: 80 
  },
  emptyIcon: { 
    fontSize: 50, 
    marginBottom: 15, 
    opacity: 0.3 
  },
  emptyText: { 
    fontSize: 15, 
    color: '#7D5A44'
  },
});

export default NoticeScreen;