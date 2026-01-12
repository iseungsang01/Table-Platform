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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>NOTICE BOARD</Text>
      </View>
      <View style={styles.headerDivider} />
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
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
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
  
  // 헤더
  header: { 
    backgroundColor: DrawerTheme.woodDark, 
    borderRadius: 12, 
    paddingVertical: 25, 
    paddingHorizontal: 20,
    marginBottom: 25, 
    borderWidth: 1.5,
    borderColor: DrawerTheme.woodFrame,
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    elevation: 8 
  },
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    marginBottom: 8
  },
  icon: { 
    fontSize: 28 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: DrawerTheme.goldBrass, 
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Cochin' : 'serif'
  },
  headerDivider: { 
    width: 50, 
    height: 2, 
    backgroundColor: DrawerTheme.goldBrass, 
    marginVertical: 10,
    opacity: 0.7
  },
  subtitle: { 
    fontSize: 12, 
    color: DrawerTheme.woodLight, 
    opacity: 0.9
  },

  // 빈 상태
  emptyBox: { 
    alignItems: 'center', 
    paddingTop: 100,
    paddingBottom: 40
  },
  emptyIcon: { 
    fontSize: 64, 
    marginBottom: 20, 
    opacity: 0.3 
  },
  emptyText: { 
    fontSize: 15, 
    color: DrawerTheme.woodLight,
    fontStyle: 'italic',
    opacity: 0.7
  },
});

export default NoticeScreen;