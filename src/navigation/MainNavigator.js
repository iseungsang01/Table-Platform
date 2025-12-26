import React from 'react';
import { Text, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/Colors';

// Screens
import HistoryScreen from '../screens/HistoryScreen';
import CouponScreen from '../screens/CouponScreen';
import VoteScreen from '../screens/VoteScreen';
import NoticeScreen from '../screens/NoticeScreen';
import CardSelectionScreen from '../screens/CardSelectionScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * 탭 네비게이터
 * 하단 탭 바로 주요 화면들 전환
 */
const TabNavigator = () => {
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
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Coupon"
        component={CouponScreen}
        options={{
          tabBarLabel: '쿠폰',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>🎟️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Vote"
        component={VoteScreen}
        options={{
          tabBarLabel: '투표',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>🗳️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Notice"
        component={NoticeScreen}
        options={{
          tabBarLabel: '공지',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24 }}>📢</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * 메인 네비게이터
 * 로그인 후 화면들을 관리
 * TabNavigator + CardSelectionScreen (모달 형식)
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
        name="CardSelection"
        component={CardSelectionScreen}
        options={{
          presentation: 'card', // 카드 형식으로 표시 (iOS에서 모달처럼)
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;