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

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.purpleMid,
          borderTopColor: Colors.gold,
          borderTopWidth: 2,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 90 : 70,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.lavender,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
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
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;