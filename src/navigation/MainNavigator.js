import React from 'react';
import { Text, Platform, View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/Colors';
import { useNotifications } from '../hooks/useNotifications';

// Screens
import HistoryScreen from '../screens/HistoryScreen';
import CouponScreen from '../screens/CouponScreen';
import VoteScreen from '../screens/VoteScreen';
import NoticeScreen from '../screens/NoticeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import VisitDetailScreen from '../screens/VisitDetailScreen'; // ✅ 변경된 이름

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * 탭 아이콘 컴포넌트 (빨간점 포함)
 */
const TabIcon = ({ emoji, hasNotification }) => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconEmoji}>{emoji}</Text>
    {hasNotification && <View style={styles.redDot} />}
  </View>
);

/**
 * 탭 네비게이터
 * 하단 탭 바로 주요 화면들 전환
 */
const TabNavigator = () => {
  const { hasAnyUnread } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.purpleMid,
          borderTopColor: Colors.gold,
          borderTopWidth: 2,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.lavender,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HistoryScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" hasNotification={false} />
          ),
        }}
      />
      <Tab.Screen
        name="Coupon"
        component={CouponScreen}
        options={{
          tabBarLabel: '쿠폰',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎟️" hasNotification={false} />
          ),
        }}
      />
      <Tab.Screen
        name="Vote"
        component={VoteScreen}
        options={{
          tabBarLabel: '투표',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🗳️" hasNotification={false} />
          ),
        }}
      />
      <Tab.Screen
        name="Notice"
        component={NoticeScreen}
        options={{
          tabBarLabel: '공지',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📢" hasNotification={hasAnyUnread} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '설정',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" hasNotification={false} />
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
        name="VisitDetail" // ✅ 변경된 라우트 이름
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