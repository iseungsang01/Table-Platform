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
    const storedCustomer = await authService.getStoredCustomer();
    
    if (storedCustomer) {
      // 저장된 고객 정보가 있으면 최신 정보로 업데이트
      const refreshed = await authService.refreshCustomer(storedCustomer.id);
      setCustomer(refreshed || storedCustomer);
    }
    
    setLoading(false);
  };

  /**
   * 로그인
   * @param {string} phoneNumber - 전화번호
   * @returns {object} { success, message? }
   */
  const login = async (phoneNumber) => {
    const result = await authService.login(phoneNumber);
    
    if (result.success) {
      setCustomer(result.customer);
    }
    
    return result;
  };

  /**
   * 로그아웃
   */
  const logout = async () => {
    await authService.logout();
    setCustomer(null);
  };

  /**
   * 고객 정보 새로고침
   * 스탬프/쿠폰 변경 시 호출
   */
  const refreshCustomer = async () => {
    if (customer) {
      const refreshed = await authService.refreshCustomer(customer.id);
      if (refreshed) {
        setCustomer(refreshed);
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