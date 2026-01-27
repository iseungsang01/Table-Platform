import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ErrorProvider } from './src/context/ErrorContext';
import { ErrorBoundary, GlobalErrorDisplay } from './src/components';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ErrorProvider>
            <AuthProvider>
              <StatusBar 
                barStyle="light-content" 
                backgroundColor="#1a0033"
              />
              <AppNavigator />
              <GlobalErrorDisplay />
            </AuthProvider>
          </ErrorProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}