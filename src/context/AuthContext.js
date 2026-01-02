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
 */
export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 앱 시작 시 초기 설정 (필요 시 자동 로그인 로직 추가 가능)
    setLoading(false);
  }, []);

  /**
   * 로그인 (수정됨 ✅)
   * @param {string} phoneNumber - 전화번호
   * @param {string} password - 비밀번호
   * @returns {object} { success, message?, customer? }
   */
  const login = async (phoneNumber, password) => {
    console.log('🔐 [Context] 로그인 시도:', phoneNumber);
    
    // 이제 password를 인자로 받아 authService에 함께 전달합니다.
    const result = await authService.login(phoneNumber, password);
    
    if (result.success) {
      console.log('✅ [Context] 로그인 성공:', result.customer.nickname);
      setCustomer(result.customer);
    } else {
      console.log('❌ [Context] 로그인 실패:', result.message);
    }
    
    return result;
  };

  /**
   * 로그아웃
   */
  const logout = async () => {
    try {
      console.log('🚪 [Context] 로그아웃 중...');
      await authService.logout();
      setCustomer(null);
      console.log('✅ [Context] 로그아웃 완료');
    } catch (error) {
      console.error('❌ [Context] 로그아웃 오류:', error);
    }
  };

  /**
   * 고객 정보 새로고침
   */
  const refreshCustomer = async () => {
    if (!customer) return;
    
    try {
      const refreshed = await authService.refreshCustomer(customer.id);
      if (refreshed) {
        setCustomer(refreshed);
        console.log('✅ [Context] 정보 갱신 완료');
      }
    } catch (error) {
      console.error('❌ [Context] 정보 갱신 오류:', error);
    }
  };

  const value = {
    customer,          // 현재 로그인한 고객 정보
    loading,           // 초기 로딩 상태
    login,             // 로그인 함수 (이제 인자 2개!)
    logout,            // 로그아웃 함수
    refreshCustomer,   // 고객 정보 새로고침 함수
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};