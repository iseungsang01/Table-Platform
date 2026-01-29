import React from 'react';
import { Text, Platform, View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../hooks/useNotifications';

// Screens
import HistoryScreen from '../screens/HistoryScreen';
import CouponScreen from '../screens/CouponScreen';
import VoteScreen from '../screens/VoteScreen';
import NoticeScreen from '../screens/NoticeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import VisitDetailScreen from '../screens/VisitDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

import { Ionicons } from '@expo/vector-icons';

/**
 * 탭 아이콘 컴포넌트 (라인 아이콘 적용)
 */
const TabIcon = ({ name, focused, hasNotification }) => (
  <View style={styles.iconContainer}>
    <Ionicons
      name={focused ? name : `${name}-outline`}
      size={24}
      color={focused ? Colors.goldMain : Colors.lavender}
    />
    {hasNotification && <View style={styles.redDot} />}
  </View>
);

/**
 * 탭 네비게이터
 * 하단 탭 바로 주요 화면들 전환
 * ✅ SafeAreaInsets 적용으로 홈 버튼 영역 보호
 */
const TabNavigator = () => {
  const { hasAnyUnread } = useNotifications();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.purpleMid,
          borderTopColor: Colors.goldMain,
          borderTopWidth: 2,
          paddingBottom: insets.bottom, // ✅ 안전 영역만큼 패딩 추가
          paddingTop: 5,
          height: 60 + insets.bottom, // ✅ 높이도 안전 영역 고려
        },
        tabBarActiveTintColor: Colors.goldMain,
        tabBarInactiveTintColor: Colors.lavender,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: insets.bottom > 0 ? 0 : 5, // ✅ 홈 버튼이 있는 기기는 여백 조정
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HistoryScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} hasNotification={false} />
          ),
        }}
      />
      <Tab.Screen
        name="Coupon"
        component={CouponScreen}
        options={{
          tabBarLabel: '쿠폰',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="ticket" focused={focused} hasNotification={false} />
          ),
        }}
      />
      <Tab.Screen
        name="Vote"
        component={VoteScreen}
        options={{
          tabBarLabel: '투표',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="checkbox" focused={focused} hasNotification={false} />
          ),
        }}
      />
      <Tab.Screen
        name="Notice"
        component={NoticeScreen}
        options={{
          tabBarLabel: '공지',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="megaphone" focused={focused} hasNotification={hasAnyUnread} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '설정',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings" focused={focused} hasNotification={false} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * 메인 네비게이터
 * 로그인 후 화면들을 관리
 * TabNavigator + VisitDetailScreen (모달 형식)
 */
const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="VisitDetail"
        component={VisitDetailScreen}
        options={{
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 24,
  },
  redDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    borderWidth: 1,
    borderColor: Colors.purpleMid,
  },
});

export default MainNavigator;