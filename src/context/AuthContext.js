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
    // 앱 시작 시 로딩만 완료하고 자동 로그인 하지 않음
    setLoading(false);
  }, []);

  /**
   * 로그인
   * @param {string} phoneNumber - 전화번호
   * @returns {object} { success, message? }
   */
  const login = async (phoneNumber) => {
    console.log('🔐 로그인 시도:', phoneNumber);
    const result = await authService.login(phoneNumber);
    
    if (result.success) {
      console.log('✅ 로그인 성공:', result.customer.nickname);
      setCustomer(result.customer);
    } else {
      console.log('❌ 로그인 실패:', result.message);
    }
    
    return result;
  };

  /**
   * 로그아웃
   * 저장된 정보도 모두 삭제
   */
  const logout = async () => {
    try {
      console.log('🚪 로그아웃 중...');
      await authService.logout();
      setCustomer(null);
      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error);
    }
  };

  /**
   * 고객 정보 새로고침
   * 스탬프/쿠폰 변경 시에만 명시적으로 호출
   */
  const refreshCustomer = async () => {
    if (!customer) return;
    
    try {
      const refreshed = await authService.refreshCustomer(customer.id);
      if (refreshed) {
        setCustomer(refreshed);
        console.log('✅ 정보 갱신 완료');
      }
    } catch (error) {
      console.error('❌ 정보 갱신 오류:', error);
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