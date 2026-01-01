import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

/**
 * 인증 Context
 * 전역 인증 상태 관리
 */
export const AuthContext = createContext();

/**
 * 인증 Provider
 * 앱 전체에 인증 상태 제공
 * 
 * @param {React.ReactNode} children - 하위 컴포넌트
 */
export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStoredAuth();
  }, []);

  /**
   * 앱 시작 시 저장된 인증 정보 확인
   */
  const checkStoredAuth = async () => {
    try {
      console.log('Checking stored auth...');
      const storedCustomer = await authService.getStoredCustomer();
      
      if (storedCustomer) {
        console.log('Found stored customer:', storedCustomer.nickname);
        // 저장된 고객 정보가 있으면 최신 정보로 업데이트 시도
        const refreshed = await authService.refreshCustomer(storedCustomer.id);
        setCustomer(refreshed || storedCustomer);
      } else {
        console.log('No stored customer found');
      }
    } catch (error) {
      console.error('Check stored auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 로그인
   * @param {string} phoneNumber - 전화번호
   * @returns {object} { success, message? }
   */
  const login = async (phoneNumber) => {
    console.log('AuthContext: Login attempt with', phoneNumber);
    const result = await authService.login(phoneNumber);
    
    if (result.success) {
      console.log('AuthContext: Login successful, setting customer');
      setCustomer(result.customer);
    } else {
      console.log('AuthContext: Login failed:', result.message);
    }
    
    return result;
  };

  /**
   * 로그아웃
   */
  const logout = async () => {
    try {
      console.log('AuthContext: Starting logout...');
      await authService.logout();
      setCustomer(null);
      console.log('AuthContext: Logout successful - customer state cleared');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    }
  };

  /**
   * 고객 정보 새로고침
   * 스탬프/쿠폰 변경 시 호출
   */
  const refreshCustomer = async () => {
    if (customer) {
      try {
        console.log('AuthContext: Refreshing customer data...');
        const refreshed = await authService.refreshCustomer(customer.id);
        if (refreshed) {
          setCustomer(refreshed);
          console.log('AuthContext: Customer data refreshed');
        }
      } catch (error) {
        console.error('AuthContext: Refresh customer error:', error);
      }
    }
  };

  const value = {
    customer,          // 현재 로그인한 고객 정보
    loading,           // 초기 로딩 상태
    login,             // 로그인 함수
    logout,            // 로그아웃 함수
    refreshCustomer,   // 고객 정보 새로고침 함수
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};