import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="#1a0033"
        />
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}